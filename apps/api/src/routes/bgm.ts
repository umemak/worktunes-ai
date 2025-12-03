import express from 'express';
import { Request, Response } from 'express';
import { BGMRequestSchema } from '@worktunes/types';
import { GensparkMusicService } from '../services/gensparkMusicServiceV2';
import { MusicGenService } from '../services/musicgenService';
import { ElevenLabsService } from '../services/elevenlabsService';
import { optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import { getPrismaClient } from '../config/database';

const router = express.Router();

// 音楽生成サービスの選択（環境変数で切り替え可能）
// 'genspark', 'musicgen', 'elevenlabs' のいずれか
const musicProvider = process.env.MUSIC_PROVIDER || 'genspark';
const gensparkMusicService = new GensparkMusicService();
const musicgenService = new MusicGenService();
const elevenlabsService = new ElevenLabsService();
const prisma = getPrismaClient();

/**
 * BGM生成エンドポイント
 * POST /api/bgm/generate
 */
router.post('/generate', 
  optionalAuth,
  validateRequest(BGMRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || 'anonymous';
      const bgmRequest = req.body;

      logger.info('BGM generation request received', {
        userId,
        workType: bgmRequest.workType,
        timeOfDay: bgmRequest.environment.timeOfDay,
        weather: bgmRequest.environment.weather.condition
      });

      // 音楽生成サービスを選択して実行
      let bgmResponse;
      switch (musicProvider) {
        case 'elevenlabs':
          bgmResponse = await elevenlabsService.generateBGM(bgmRequest);
          break;
        case 'musicgen':
          bgmResponse = await musicgenService.generateBGM(bgmRequest);
          break;
        case 'genspark':
        default:
          bgmResponse = await gensparkMusicService.generateBGM(bgmRequest);
          break;
      }

      // データベースに生成記録を保存
      await prisma.generatedBgm.create({
        data: {
          id: bgmResponse.id,
          userId: userId,
          title: bgmResponse.metadata.title,
          audioUrl: bgmResponse.audioUrl,
          duration: bgmResponse.metadata.duration,
          metadata: JSON.stringify(bgmResponse.metadata),
          environmentData: JSON.stringify(bgmRequest.environment),
          generationParams: JSON.stringify({
            workType: bgmRequest.workType,
            genre: bgmRequest.genre,
            mood: bgmRequest.mood,
            modelUsed: musicProvider === 'elevenlabs' 
              ? 'elevenlabs/eleven_multilingual_v2' 
              : musicProvider === 'musicgen' 
                ? 'facebook/musicgen-small' 
                : 'genspark_multi_model'
          })
        }
      });

      // ユーザーアクティビティを記録
      await prisma.userActivity.create({
        data: {
          userId: userId,
          bgmId: bgmResponse.id,
          activityType: 'generate'
        }
      });

      logger.info('BGM generation completed successfully', {
        userId,
        bgmId: bgmResponse.id,
        duration: bgmResponse.metadata.duration
      });

      res.json({
        success: true,
        data: bgmResponse,
        message: 'BGM generated successfully'
      });

    } catch (error: any) {
      logger.error('BGM generation failed', error);
      res.status(500).json({
        success: false,
        error: 'BGM generation failed',
        message: error?.message || 'Unknown error'
      });
    }
  }
);

/**
 * BGM生成履歴取得
 * GET /api/bgm/history
 */
router.get('/history',
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const bgmHistory = await prisma.generatedBgm.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          audioUrl: true,
          duration: true,
          metadata: true,
          environmentData: true,
          playCount: true,
          userRating: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: bgmHistory,
        pagination: {
          limit,
          offset,
          total: await prisma.generatedBgm.count({ where: { userId } })
        }
      });

    } catch (error: any) {
      logger.error('Failed to fetch BGM history', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch BGM history',
        message: error?.message || 'Unknown error'
      });
    }
  }
);

/**
 * 特定BGM取得
 * GET /api/bgm/:id
 */
router.get('/:id',
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const bgm = await prisma.generatedBgm.findFirst({
        where: { 
          id,
          userId // ユーザー自身のBGMのみアクセス可能
        }
      });

      if (!bgm) {
        res.status(404).json({
          success: false,
          error: 'BGM not found'
        });
        return;
      }

      // 再生回数を増加
      await prisma.generatedBgm.update({
        where: { id },
        data: { playCount: { increment: 1 } }
      });

      // アクティビティログ
      if (userId) {
        await prisma.userActivity.create({
          data: {
            userId,
            bgmId: id,
            activityType: 'play'
          }
        });
      }

      res.json({
        success: true,
        data: bgm
      });

    } catch (error) {
      logger.error('Failed to fetch BGM', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch BGM'
      });
    }
  }
);

/**
 * BGM評価
 * POST /api/bgm/:id/feedback
 */
router.post('/:id/feedback',
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, skipReason } = req.body;
      const userId = req.user?.userId;

      // 評価を更新
      if (rating) {
        await prisma.generatedBgm.update({
          where: { id },
          data: { userRating: rating }
        });
      }

      // アクティビティログ
      const activityType = skipReason ? 'skip' : 'like';
      if (userId) {
        await prisma.userActivity.create({
          data: {
            userId,
            bgmId: id,
            activityType
          }
        });
      }

      logger.info('BGM feedback received', {
        userId,
        bgmId: id,
        rating,
        activityType
      });

      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });

    } catch (error) {
      logger.error('Failed to record feedback', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback'
      });
    }
  }
);

/**
 * BGM削除
 * DELETE /api/bgm/:id
 */
router.delete('/:id',
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const deleted = await prisma.generatedBgm.deleteMany({
        where: { 
          id,
          userId // ユーザー自身のBGMのみ削除可能
        }
      });

      if (deleted.count === 0) {
        res.status(404).json({
          success: false,
          error: 'BGM not found or access denied'
        });
        return;
      }

      logger.info('BGM deleted', { userId, bgmId: id });

      res.json({
        success: true,
        message: 'BGM deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete BGM', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete BGM'
      });
    }
  }
);

/**
 * プロバイダー情報取得
 * GET /api/bgm/providers
 */
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = {
      current: musicProvider,
      available: ['genspark', 'musicgen', 'elevenlabs'],
      details: {
        genspark: {
          name: 'Genspark Multi-Model',
          description: 'Multiple AI models with environment adaptation',
          maxDuration: 180,
          features: ['Multi-model selection', 'Environment-adaptive', 'High quality'],
          requiresApiKey: true,
          apiKeyConfigured: !!process.env.GENSPARK_TOKEN
        },
        musicgen: {
          name: 'MusicGen (Hugging Face)',
          description: 'Meta\'s open-source music generation model',
          maxDuration: 30,
          features: ['Free to use', 'Text-to-music', 'Open source'],
          requiresApiKey: true,
          apiKeyConfigured: !!process.env.HUGGINGFACE_API_TOKEN
        },
        elevenlabs: {
          name: 'ElevenLabs Sound Effects v2',
          description: 'Professional sound generation API',
          maxDuration: 30,
          features: ['Highest quality', 'Fast generation', 'Natural language prompts', '48kHz sample rate'],
          requiresApiKey: true,
          apiKeyConfigured: !!process.env.ELEVENLABS_API_KEY
        }
      }
    };

    res.json({
      success: true,
      data: providers
    });

  } catch (error: any) {
    logger.error('Failed to get provider info', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider info'
    });
  }
});

/**
 * プロバイダーヘルスチェック
 * GET /api/bgm/health/:provider
 */
router.get('/health/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    let isHealthy = false;

    switch (provider) {
      case 'elevenlabs':
        isHealthy = await elevenlabsService.healthCheck();
        break;
      case 'musicgen':
        isHealthy = await musicgenService.healthCheck();
        break;
      case 'genspark':
        // Gensparkのヘルスチェックは環境変数の存在確認
        isHealthy = !!process.env.GENSPARK_TOKEN;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid provider'
        });
    }

    res.json({
      success: true,
      data: {
        provider,
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Provider health check failed', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

export default router;