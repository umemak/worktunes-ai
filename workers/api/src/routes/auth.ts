import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../index';
import { hashPassword, verifyPassword, generateId } from '../utils/crypto';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';

export const authRoutes = new Hono<{ Bindings: Env }>();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * POST /api/auth/register
 */
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, username } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await c.env.DB
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return c.json({
        success: false,
        message: 'User already exists',
      }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = generateId('user');
    const now = Date.now();

    await c.env.DB
      .prepare('INSERT INTO users (id, email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email, username, passwordHash, now, now)
      .run();

    // Create profile
    const profileId = generateId('profile');
    await c.env.DB
      .prepare('INSERT INTO user_profiles (id, user_id, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .bind(profileId, userId, 'Unknown', now, now)
      .run();

    // Generate tokens
    const accessToken = await generateAccessToken({ userId, email }, c.env.JWT_SECRET);
    const refreshToken = await generateRefreshToken({ userId, email }, c.env.JWT_REFRESH_SECRET);

    // Store refresh token in KV
    await c.env.SESSION.put(`refresh_token:${userId}`, refreshToken, {
      expirationTtl: 7 * 24 * 60 * 60, // 7 days
    });

    return c.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: userId, email, username },
        accessToken,
        refreshToken,
      },
    }, 201);
  } catch (error: any) {
    console.error('Register error:', error);
    return c.json({
      success: false,
      message: error.message || 'Registration failed',
    }, 400);
  }
});

/**
 * POST /api/auth/login
 */
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await c.env.DB
      .prepare('SELECT id, email, username, password_hash, is_active FROM users WHERE email = ?')
      .bind(email)
      .first() as any;

    if (!user) {
      return c.json({
        success: false,
        message: 'Invalid credentials',
      }, 401);
    }

    if (!user.is_active) {
      return c.json({
        success: false,
        message: 'Account is deactivated',
      }, 403);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({
        success: false,
        message: 'Invalid credentials',
      }, 401);
    }

    // Generate tokens
    const accessToken = await generateAccessToken(
      { userId: user.id, email: user.email },
      c.env.JWT_SECRET
    );
    const refreshToken = await generateRefreshToken(
      { userId: user.id, email: user.email },
      c.env.JWT_REFRESH_SECRET
    );

    // Store refresh token
    await c.env.SESSION.put(`refresh_token:${user.id}`, refreshToken, {
      expirationTtl: 7 * 24 * 60 * 60,
    });

    // Update last login
    await c.env.DB
      .prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .bind(Date.now(), user.id)
      .run();

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      message: error.message || 'Login failed',
    }, 400);
  }
});

/**
 * POST /api/auth/refresh
 */
authRoutes.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = refreshSchema.parse(body);

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken, c.env.JWT_REFRESH_SECRET);

    // Check stored token
    const storedToken = await c.env.SESSION.get(`refresh_token:${payload.userId}`);
    if (storedToken !== refreshToken) {
      return c.json({
        success: false,
        message: 'Invalid refresh token',
      }, 401);
    }

    // Get user
    const user = await c.env.DB
      .prepare('SELECT id, email, username, is_active FROM users WHERE id = ?')
      .bind(payload.userId)
      .first() as any;

    if (!user || !user.is_active) {
      return c.json({
        success: false,
        message: 'User not found or inactive',
      }, 401);
    }

    // Generate new tokens
    const newAccessToken = await generateAccessToken(
      { userId: user.id, email: user.email },
      c.env.JWT_SECRET
    );
    const newRefreshToken = await generateRefreshToken(
      { userId: user.id, email: user.email },
      c.env.JWT_REFRESH_SECRET
    );

    // Update stored token
    await c.env.SESSION.put(`refresh_token:${user.id}`, newRefreshToken, {
      expirationTtl: 7 * 24 * 60 * 60,
    });

    return c.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    return c.json({
      success: false,
      message: error.message || 'Token refresh failed',
    }, 401);
  }
});

/**
 * POST /api/auth/logout
 */
authRoutes.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({
        success: false,
        message: 'Authorization header required',
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyAccessToken(token, c.env.JWT_SECRET);

    // Delete refresh token
    await c.env.SESSION.delete(`refresh_token:${payload.userId}`);

    return c.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return c.json({
      success: false,
      message: error.message || 'Logout failed',
    }, 400);
  }
});

/**
 * GET /api/auth/me
 */
authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({
        success: false,
        message: 'Authorization header required',
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyAccessToken(token, c.env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        user: payload,
      },
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: 'Invalid token',
    }, 403);
  }
});
