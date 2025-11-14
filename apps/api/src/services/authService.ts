import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { cache } from '../config/redis';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '15m'; // アクセストークン有効期限
const JWT_REFRESH_EXPIRES_IN = '7d'; // リフレッシュトークン有効期限

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * パスワードをハッシュ化
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * パスワードを検証
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * アクセストークンを生成
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * リフレッシュトークンを生成
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  }

  /**
   * トークンペアを生成
   */
  generateTokens(payload: TokenPayload): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * アクセストークンを検証
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * リフレッシュトークンを検証
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * ユーザー登録
   */
  async register(email: string, password: string, username: string) {
    try {
      // 既存ユーザーチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // パスワードハッシュ化
      const hashedPassword = await this.hashPassword(password);

      // ユーザー作成
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: hashedPassword,
          profile: {
            create: {
              location: 'Unknown',
            },
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
        },
      });

      // トークン生成
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // リフレッシュトークンをRedisに保存
      await cache.set(`refresh_token:${user.id}`, tokens.refreshToken, 7 * 24 * 60 * 60);

      logger.info(`User registered: ${user.email}`);

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * ユーザーログイン
   */
  async login(email: string, password: string) {
    try {
      // ユーザー検索
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // パスワード検証
      const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // トークン生成
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // リフレッシュトークンをRedisに保存
      await cache.set(`refresh_token:${user.id}`, tokens.refreshToken, 7 * 24 * 60 * 60);

      // 最終ログイン時刻を更新
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * トークンをリフレッシュ
   */
  async refreshToken(refreshToken: string) {
    try {
      // リフレッシュトークン検証
      const payload = this.verifyRefreshToken(refreshToken);

      // Redisに保存されているトークンと照合
      const storedToken = await cache.get<string>(`refresh_token:${payload.userId}`);
      if (storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // ユーザー存在確認
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // 新しいトークンペアを生成
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // 新しいリフレッシュトークンをRedisに保存
      await cache.set(`refresh_token:${user.id}`, tokens.refreshToken, 7 * 24 * 60 * 60);

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * ログアウト
   */
  async logout(userId: string) {
    try {
      // Redisからリフレッシュトークンを削除
      await cache.del(`refresh_token:${userId}`);
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
