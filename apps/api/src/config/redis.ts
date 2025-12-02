import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Redis Client インスタンス
 */
let redis: Redis | null = null;

/**
 * Redisクライアント取得
 */
export const getRedisClient = (): Redis => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        logger.error('Redis connection error', err);
        return true;
      }
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redis.on('error', (err) => {
      logger.error('Redis error', err);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  return redis;
};

/**
 * Redis接続
 */
export const connectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.ping();
    logger.info('Successfully connected to Redis');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', error);
    // Redisは必須ではないため、エラーでもサーバーは起動可能
  }
};

/**
 * Redis切断
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redis) {
      await redis.quit();
      logger.info('Disconnected from Redis');
      redis = null;
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis', error);
  }
};

/**
 * キャッシュ取得
 */
export const getCache = async <T = any>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Failed to get cache', { key, error });
    return null;
  }
};

/**
 * キャッシュ設定
 */
export const setCache = async (
  key: string,
  value: any,
  expirationSeconds: number = 3600
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setex(key, expirationSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to set cache', { key, error });
  }
};

/**
 * キャッシュ削除
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Failed to delete cache', { key, error });
  }
};

/**
 * パターンマッチでキャッシュクリア
 */
export const clearCachePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    logger.error('Failed to clear cache pattern', { pattern, error });
  }
};

export default getRedisClient;
