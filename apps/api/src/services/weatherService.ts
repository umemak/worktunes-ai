import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * OpenWeatherMap APIレスポンス型
 */
interface OpenWeatherMapResponse {
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  name: string;
  sys: {
    country: string;
  };
}

/**
 * 天気状態マッピング
 */
type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

/**
 * 天気データ型
 */
export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  location: string;
  description: string;
  icon: string;
}

/**
 * WeatherService - OpenWeatherMap API統合
 */
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('OPENWEATHER_API_KEY not set, weather service will return mock data');
    }
  }

  /**
   * 座標から天気を取得
   */
  async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        return this.getMockWeatherData();
      }

      const response = await axios.get<OpenWeatherMapResponse>(
        `${this.baseUrl}/weather`,
        {
          params: {
            lat,
            lon,
            appid: this.apiKey,
            units: 'metric', // 摂氏温度
            lang: 'ja' // 日本語の説明
          },
          timeout: 5000
        }
      );

      return this.parseWeatherResponse(response.data);

    } catch (error) {
      logger.error('Failed to fetch weather by coordinates', { error, lat, lon });
      
      // エラー時はモックデータを返す
      return this.getMockWeatherData();
    }
  }

  /**
   * 都市名から天気を取得
   */
  async getWeatherByCity(city: string): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        return this.getMockWeatherData();
      }

      const response = await axios.get<OpenWeatherMapResponse>(
        `${this.baseUrl}/weather`,
        {
          params: {
            q: city,
            appid: this.apiKey,
            units: 'metric',
            lang: 'ja'
          },
          timeout: 5000
        }
      );

      return this.parseWeatherResponse(response.data);

    } catch (error) {
      logger.error('Failed to fetch weather by city', { error, city });
      return this.getMockWeatherData();
    }
  }

  /**
   * OpenWeatherMapレスポンスを標準形式に変換
   */
  private parseWeatherResponse(data: OpenWeatherMapResponse): WeatherData {
    const weatherMain = data.weather[0]?.main || 'Clear';
    const weatherId = data.weather[0]?.id || 800;

    return {
      condition: this.mapWeatherCondition(weatherMain, weatherId),
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      location: `${data.name}, ${data.sys.country}`,
      description: data.weather[0]?.description || '晴れ',
      icon: data.weather[0]?.icon || '01d'
    };
  }

  /**
   * OpenWeatherMapの天気状態を標準状態にマッピング
   */
  private mapWeatherCondition(weatherMain: string, weatherId: number): WeatherCondition {
    // OpenWeatherMap天気ID範囲
    // 2xx: Thunderstorm
    // 3xx: Drizzle
    // 5xx: Rain
    // 6xx: Snow
    // 7xx: Atmosphere (霧など)
    // 800: Clear
    // 80x: Clouds

    if (weatherId >= 200 && weatherId < 300) {
      return 'stormy'; // 雷雨
    }
    
    if (weatherId >= 300 && weatherId < 600) {
      return 'rainy'; // 霧雨・雨
    }
    
    if (weatherId >= 600 && weatherId < 700) {
      return 'snowy'; // 雪
    }
    
    if (weatherId === 800) {
      return 'sunny'; // 晴れ
    }
    
    if (weatherId > 800 && weatherId < 900) {
      // 曇り度合いで判定
      if (weatherId === 801 || weatherId === 802) {
        return 'sunny'; // 少し雲がある程度は晴れ扱い
      }
      return 'cloudy'; // 曇り
    }

    // デフォルトは晴れ
    return 'sunny';
  }

  /**
   * モック天気データ（開発・テスト用）
   */
  private getMockWeatherData(): WeatherData {
    const conditions: WeatherCondition[] = ['sunny', 'cloudy', 'rainy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      condition: randomCondition,
      temperature: 20 + Math.floor(Math.random() * 10),
      humidity: 50 + Math.floor(Math.random() * 30),
      location: 'Tokyo, JP',
      description: this.getConditionDescription(randomCondition),
      icon: '01d'
    };
  }

  /**
   * 天気状態の日本語説明
   */
  private getConditionDescription(condition: WeatherCondition): string {
    const descriptions = {
      sunny: '晴れ',
      cloudy: '曇り',
      rainy: '雨',
      snowy: '雪',
      stormy: '嵐'
    };
    return descriptions[condition];
  }

  /**
   * IPアドレスから位置情報を推定して天気を取得
   */
  async getWeatherByIP(ip?: string): Promise<WeatherData> {
    try {
      // 実装の簡略化のため、デフォルト位置（東京）の天気を返す
      // 本格実装ではIP Geolocation APIを使用
      return await this.getWeatherByCoordinates(35.6762, 139.6503); // 東京
    } catch (error) {
      logger.error('Failed to fetch weather by IP', { error });
      return this.getMockWeatherData();
    }
  }
}

export default WeatherService;
