import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * グローバルエラーハンドラー
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // AppErrorの場合
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // ValidationErrorの場合（Zodなど）
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // JWTエラーの場合
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Prismaエラーの場合
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  }

  // エラーログ
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    isOperational
  });

  // 本番環境ではスタックトレースを隠す
  const response: any = {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  // 開発環境ではスタックトレースを含める
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(statusCode).json(response);
};

/**
 * 非同期ハンドラーラッパー
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404エラーハンドラー
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404,
    path: req.path
  });
};
