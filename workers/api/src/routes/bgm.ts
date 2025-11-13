import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../index';
import { verifyAccessToken } from '../utils/jwt';
import { generateId } from '../utils/crypto';

export const bgmRoutes = new Hono<{ Bindings: Env }>();

const generateSchema = z.object({
  timeOfDay: z.enum(['morning', 'late_morning', 'afternoon', 'evening', 'night']).optional(),
  weatherCondition: z.enum(['clear', 'clouds', 'rain', 'snow', 'other']).optional(),
  customPrompt: z.string().optional(),
  durationSeconds: z.number().min(30).max(300).optional(),
});

// Authentication middleware
async function authenticate(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, message: 'Authorization required' }, 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyAccessToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ success: false, message: 'Invalid token' }, 403);
  }
}

/**
 * POST /api/bgm/generate
 */
bgmRoutes.post('/generate', authenticate, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { timeOfDay, weatherCondition, customPrompt, durationSeconds } = generateSchema.parse(body);

    const currentTimeOfDay = timeOfDay || getCurrentTimeOfDay();
    const currentWeather = weatherCondition || 'clear';

    // Check cache
    const cacheKey = `bgm:${currentTimeOfDay}:${currentWeather}`;
    const cached = await c.env.CACHE.get(cacheKey, 'json');
    
    if (cached) {
      // Save to history
      await saveBGMHistory(c.env.DB, user.userId, cached);
      return c.json({
        success: true,
        message: 'BGM retrieved from cache',
        data: cached,
      });
    }

    // Generate BGM (mock for now without API key)
    const bgmData = {
      id: generateId('bgm'),
      audioUrl: 'https://example.com/demo-audio.mp3',
      prompt: customPrompt || generatePrompt(currentTimeOfDay, currentWeather),
      timeOfDay: currentTimeOfDay,
      weatherCondition: currentWeather,
      musicParameters: {
        mood: getMood(currentTimeOfDay, currentWeather),
        instruments: getInstruments(currentTimeOfDay, currentWeather),
        bpm: '80-100',
        key: ['C', 'Am'],
        energy: 'medium',
      },
      generatedAt: new Date(),
    };

    // Cache for 24 hours
    await c.env.CACHE.put(cacheKey, JSON.stringify(bgmData), {
      expirationTtl: 24 * 60 * 60,
    });

    // Save to history
    await saveBGMHistory(c.env.DB, user.userId, bgmData);

    return c.json({
      success: true,
      message: 'BGM generated successfully',
      data: bgmData,
    }, 201);
  } catch (error: any) {
    console.error('BGM generation error:', error);
    return c.json({
      success: false,
      message: error.message || 'BGM generation failed',
    }, 400);
  }
});

/**
 * GET /api/bgm/history
 */
bgmRoutes.get('/history', authenticate, async (c) => {
  try {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '20');

    const history = await c.env.DB
      .prepare('SELECT * FROM generated_bgm WHERE user_id = ? ORDER BY generated_at DESC LIMIT ?')
      .bind(user.userId, limit)
      .all();

    return c.json({
      success: true,
      data: {
        history: history.results,
        total: history.results?.length || 0,
      },
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message || 'Failed to fetch history',
    }, 400);
  }
});

/**
 * GET /api/bgm/:id
 */
bgmRoutes.get('/:id', authenticate, async (c) => {
  try {
    const id = c.req.param('id');
    
    const bgm = await c.env.DB
      .prepare('SELECT * FROM generated_bgm WHERE id = ?')
      .bind(id)
      .first();

    if (!bgm) {
      return c.json({
        success: false,
        message: 'BGM not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: bgm,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message || 'Failed to fetch BGM',
    }, 400);
  }
});

// Helper functions
function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'late_morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function generatePrompt(timeOfDay: string, weather: string): string {
  return `Create ${timeOfDay} background music for ${weather} weather. Instrumental, ambient, suitable for work and concentration.`;
}

function getMood(timeOfDay: string, weather: string): string {
  const moods: Record<string, Record<string, string>> = {
    morning: { clear: 'uplifting', clouds: 'gentle', rain: 'calm' },
    afternoon: { clear: 'energetic', clouds: 'balanced', rain: 'meditative' },
    evening: { clear: 'relaxed', clouds: 'calm', rain: 'peaceful' },
  };
  return moods[timeOfDay]?.[weather] || 'neutral';
}

function getInstruments(timeOfDay: string, weather: string): string[] {
  return ['piano', 'acoustic_guitar', 'strings'];
}

async function saveBGMHistory(db: D1Database, userId: string, bgmData: any) {
  try {
    await db
      .prepare('INSERT INTO generated_bgm (id, user_id, audio_url, prompt, time_of_day, weather_condition, music_parameters, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        bgmData.id,
        userId,
        bgmData.audioUrl,
        bgmData.prompt,
        bgmData.timeOfDay,
        bgmData.weatherCondition,
        JSON.stringify(bgmData.musicParameters),
        Date.now()
      )
      .run();
  } catch (error) {
    console.error('Failed to save BGM history:', error);
  }
}
