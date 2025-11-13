import { Router } from 'express';
import { authService } from '../services/authService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// レートリミッター設定
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回まで
  message: 'Too many authentication attempts, please try again later',
});

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * ユーザー登録
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;

    const result = await authService.register(email, password, username);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * ユーザーログイン
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * トークンリフレッシュ
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  })
);

/**
 * POST /api/auth/logout
 * ログアウト
 */
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    await authService.logout(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  })
);

/**
 * GET /api/auth/me
 * 現在のユーザー情報取得
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  })
);

export default router;
