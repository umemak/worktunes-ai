import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// カスタムログフォーマット
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // メタデータがある場合は追加
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  
  // スタックトレースがある場合は追加
  if (stack) {
    log += `\n${stack}`;
  }
  
  return log;
});

// 開発環境用のカラフルなフォーマット
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

// 本番環境用のJSON フォーマット
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  winston.format.json()
);

// コンソール出力
const consoleTransport = new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat
});

// ファイル出力（エラーログ）
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat
});

// ファイル出力（全ログ）
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: prodFormat
});

// ロガーインスタンス作成
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport
  ],
  // 未処理のエラーをキャッチ
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// 開発環境ではログレベルをdebugに設定
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}

// HTTPリクエストログ用のヘルパー
export const logRequest = (req: any, res: any, responseTime: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });
};

// エラーログ用のヘルパー
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context
  });
};

export default logger;
