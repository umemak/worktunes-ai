import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth';
import { bgmRoutes } from './routes/bgm';
import { environmentRoutes } from './routes/environment';

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ELEVENLABS_API_KEY: string;
  OPENWEATHER_API_KEY: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://worktunes.ai', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/bgm', bgmRoutes);
app.route('/api/environment', environmentRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found',
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    message: err.message || 'Internal server error',
  }, 500);
});

export default app;
