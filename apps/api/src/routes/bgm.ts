import express from 'express';
import { Request, Response } from 'express';
import { BGMRequestSchema, BGMResponse } from '@worktunes/types';
import { GensparkMusicService } from '../services/gensparkMusicService';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const gensparkMusicService = new GensparkMusicService();
const prisma = new PrismaClient();

/**
 * BGM生成エンドポイント
 * POST /api/bgm/generate
 */
router.post('/generate', 
  authMiddleware,
  validateRequest(BGMRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const bgmRequest = req.body;

      logger.info('BGM generation request received', {
        userId,
        workType: bgmRequest.workType,
        timeOfDay: bgmRequest.environment.timeOfDay,
        weather: bgmRequest.environment.weather.condition
      });

      // Gensparkを使用してBGM生成
      const bgmResponse = await gensparkMusicService.generateBGM(bgmRequest);

      // データベースに生成記録を保存
      const savedBgm = await prisma.generatedBgm.create({
        data: {
          id: bgmResponse.id,
          userId: userId,
          title: bgmResponse.metadata.title,
          audioUrl: bgmResponse.audioUrl,
          duration: bgmResponse.metadata.duration,
          metadata: bgmResponse.metadata,
          environmentData: bgmRequest.environment,
          generationParams: {
            workType: bgmRequest.workType,
            genre: bgmRequest.genre,
            mood: bgmRequest.mood,
            modelUsed: 'genspark_multi_model'
          }
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

    } catch (error) {
      logger.error('BGM generation failed', error);
      res.status(500).json({
        success: false,
        error: 'BGM generation failed',
        message: error.message
      });
    }
  }
);

/**
 * BGM生成履歴取得
 * GET /api/bgm/history
 */
router.get('/history',
  authMiddleware,
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

    } catch (error) {
      logger.error('Failed to fetch BGM history', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch BGM history',
        message: error.message
      });
    }
  }
);

/**
 * 特定BGM取得
 * GET /api/bgm/:id
 */
router.get('/:id',
  authMiddleware,
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
        return res.status(404).json({
          success: false,
          error: 'BGM not found'
        });
      }

      // 再生回数を増加
      await prisma.generatedBgm.update({
        where: { id },
        data: { playCount: { increment: 1 } }
      });

      // アクティビティログ
      await prisma.userActivity.create({
        data: {
          userId,
          bgmId: id,
          activityType: 'play'
        }
      });

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
  authMiddleware,
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
      await prisma.userActivity.create({
        data: {
          userId,
          bgmId: id,
          activityType
        }
      });

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
  authMiddleware,
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
        return res.status(404).json({
          success: false,
          error: 'BGM not found or access denied'
        });
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

export default router;