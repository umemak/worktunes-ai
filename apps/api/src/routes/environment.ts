import { Router } from 'express';
import { weatherService } from '../services/weatherService';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import { getTimeOfDay } from '../services/environmentMapper';

const router = Router();

// バリデーションスキーマ
const coordinatesSchema = z.object({
  lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
  lon: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
});

const citySchema = z.object({
  city: z.string().min(1),
});

/**
 * GET /api/environment/current
 * 現在の環境データ取得（天気 + 時間帯）
 */
router.get(
  '/current',
  optionalAuth,
  validateQuery(coordinatesSchema.or(citySchema)),
  asyncHandler(async (req: AuthRequest, res) => {
    let weatherData;

    // 座標指定の場合
    if (req.query.lat && req.query.lon) {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      weatherData = await weatherService.getCurrentWeather({ lat, lon });
    }
    // 都市名指定の場合
    else if (req.query.city) {
      weatherData = await weatherService.getWeatherByCity(req.query.city as string);
    } else {
      throw new AppError('Either coordinates (lat, lon) or city name is required', 400);
    }

    // 現在の時間帯を取得
    const currentHour = new Date().getHours();
    const timeOfDay = getTimeOfDay(currentHour);

    res.status(200).json({
      success: true,
      data: {
        weather: weatherData,
        timeOfDay: {
          current: timeOfDay,
          hour: currentHour,
        },
        timestamp: new Date(),
      },
    });
  })
);

/**
 * GET /api/environment/weather
 * 天気情報のみ取得
 */
router.get(
  '/weather',
  optionalAuth,
  validateQuery(coordinatesSchema.or(citySchema)),
  asyncHandler(async (req: AuthRequest, res) => {
    let weatherData;

    if (req.query.lat && req.query.lon) {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      weatherData = await weatherService.getCurrentWeather({ lat, lon });
    } else if (req.query.city) {
      weatherData = await weatherService.getWeatherByCity(req.query.city as string);
    } else {
      throw new AppError('Either coordinates (lat, lon) or city name is required', 400);
    }

    res.status(200).json({
      success: true,
      data: weatherData,
    });
  })
);

/**
 * GET /api/environment/time-of-day
 * 時間帯情報のみ取得
 */
router.get(
  '/time-of-day',
  asyncHandler(async (req, res) => {
    const currentHour = new Date().getHours();
    const timeOfDay = getTimeOfDay(currentHour);

    res.status(200).json({
      success: true,
      data: {
        timeOfDay,
        hour: currentHour,
        timestamp: new Date(),
      },
    });
  })
);

export default router;
