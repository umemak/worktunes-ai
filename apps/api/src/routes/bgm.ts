import { Router } from 'express';
import { musicGeneratorService } from '../services/musicGenerator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// バリデーションスキーマ
const generateBGMSchema = z.object({
  timeOfDay: z.enum(['morning', 'late_morning', 'afternoon', 'evening', 'night']).optional(),
  weatherCondition: z.enum(['clear', 'clouds', 'rain', 'snow', 'other']).optional(),
  customPrompt: z.string().optional(),
  durationSeconds: z.number().min(30).max(300).optional(),
});

const historyQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

/**
 * POST /api/bgm/generate
 * BGM生成
 */
router.post(
  '/generate',
  authenticateToken,
  validateBody(generateBGMSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { timeOfDay, weatherCondition, customPrompt, durationSeconds } = req.body;

    const bgm = await musicGeneratorService.generateBGM({
      userId: req.user.userId,
      timeOfDay,
      weatherCondition,
      customPrompt,
      durationSeconds,
    });

    res.status(201).json({
      success: true,
      message: 'BGM generated successfully',
      data: bgm,
    });
  })
);

/**
 * GET /api/bgm/history
 * BGM生成履歴取得
 */
router.get(
  '/history',
  authenticateToken,
  validateQuery(historyQuerySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const history = await musicGeneratorService.getUserBGMHistory(req.user.userId, limit);

    res.status(200).json({
      success: true,
      data: {
        history,
        total: history.length,
      },
    });
  })
);

/**
 * GET /api/bgm/:id
 * 特定のBGM取得
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;

    const bgm = await musicGeneratorService.getBGMById(id);

    res.status(200).json({
      success: true,
      data: bgm,
    });
  })
);

export default router;
