import axios from 'axios';
import { cache } from '../config/redis';
import logger from '../utils/logger';
import { normalizeWeatherCondition, WeatherCondition } from './environmentMapper';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_TTL = 5 * 60; // 5分間キャッシュ

export interface WeatherData {
  location: string;
  temperature: number;
  condition: WeatherCondition;
  conditionCode: number;
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export class WeatherService {
  /**
   * 現在の天気情報を取得
   */
  async getCurrentWeather(coords: Coordinates): Promise<WeatherData> {
    const { lat, lon } = coords;
    const cacheKey = `weather:${lat}:${lon}`;

    try {
      // キャッシュチェック
      const cachedWeather = await cache.get<WeatherData>(cacheKey);
      if (cachedWeather) {
        logger.debug('Weather data retrieved from cache');
        return cachedWeather;
      }

      // OpenWeatherMap APIから取得
      if (!OPENWEATHER_API_KEY) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric', // 摂氏温度
          lang: 'ja', // 日本語の説明
        },
        timeout: 5000,
      });

      const data = response.data;
      const weatherData: WeatherData = {
        location: data.name,
        temperature: Math.round(data.main.temp),
        conditionCode: data.weather[0].id,
        condition: normalizeWeatherCondition(data.weather[0].id),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        timestamp: new Date(),
      };

      // キャッシュに保存
      await cache.set(cacheKey, weatherData, CACHE_TTL);
      logger.info(`Weather data fetched for ${weatherData.location}`);

      return weatherData;
    } catch (error) {
      logger.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * 都市名から天気情報を取得
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    const cacheKey = `weather:city:${cityName}`;

    try {
      // キャッシュチェック
      const cachedWeather = await cache.get<WeatherData>(cacheKey);
      if (cachedWeather) {
        logger.debug('Weather data retrieved from cache');
        return cachedWeather;
      }

      if (!OPENWEATHER_API_KEY) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          q: cityName,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          lang: 'ja',
        },
        timeout: 5000,
      });

      const data = response.data;
      const weatherData: WeatherData = {
        location: data.name,
        temperature: Math.round(data.main.temp),
        conditionCode: data.weather[0].id,
        condition: normalizeWeatherCondition(data.weather[0].id),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        timestamp: new Date(),
      };

      // キャッシュに保存
      await cache.set(cacheKey, weatherData, CACHE_TTL);
      logger.info(`Weather data fetched for ${weatherData.location}`);

      return weatherData;
    } catch (error) {
      logger.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * 複数都市の天気情報を取得
   */
  async getMultipleCitiesWeather(cityIds: number[]): Promise<WeatherData[]> {
    try {
      if (!OPENWEATHER_API_KEY) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const promises = cityIds.map(async (cityId) => {
        const cacheKey = `weather:cityid:${cityId}`;
        const cached = await cache.get<WeatherData>(cacheKey);
        
        if (cached) {
          return cached;
        }

        const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
          params: {
            id: cityId,
            appid: OPENWEATHER_API_KEY,
            units: 'metric',
            lang: 'ja',
          },
          timeout: 5000,
        });

        const data = response.data;
        const weatherData: WeatherData = {
          location: data.name,
          temperature: Math.round(data.main.temp),
          conditionCode: data.weather[0].id,
          condition: normalizeWeatherCondition(data.weather[0].id),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          timestamp: new Date(),
        };

        await cache.set(cacheKey, weatherData, CACHE_TTL);
        return weatherData;
      });

      return await Promise.all(promises);
    } catch (error) {
      logger.error('Error fetching multiple cities weather:', error);
      throw new Error('Failed to fetch weather data for multiple cities');
    }
  }
}

export const weatherService = new WeatherService();
