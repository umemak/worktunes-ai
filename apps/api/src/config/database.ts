import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Prisma Client インスタンス
 * シングルトンパターンで実装
 */
let prisma: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }
  return prisma;
};

/**
 * データベース接続
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Successfully connected to PostgreSQL database');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
};

/**
 * データベース切断
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Disconnected from PostgreSQL database');
    }
  } catch (error) {
    logger.error('Error disconnecting from database', error);
    throw error;
  }
};

export default getPrismaClient;
