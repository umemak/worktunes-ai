import axios from 'axios';
import { cache } from '../config/redis';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import {
  getTimeOfDay,
  getMusicParameters,
  generateMusicPrompt,
  TimeOfDay,
  WeatherCondition,
} from './environmentMapper';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const CACHE_TTL = 24 * 60 * 60; // 24時間キャッシュ

export interface BGMGenerationRequest {
  userId: string;
  timeOfDay?: TimeOfDay;
  weatherCondition?: WeatherCondition;
  customPrompt?: string;
  durationSeconds?: number;
}

export interface BGMGenerationResponse {
  id: string;
  audioUrl: string;
  prompt: string;
  timeOfDay: TimeOfDay;
  weatherCondition: WeatherCondition;
  musicParameters: {
    mood: string;
    instruments: string[];
    bpm: string;
    key: string[];
    energy: string;
  };
  generatedAt: Date;
}

export class MusicGeneratorService {
  /**
   * BGMを生成
   */
  async generateBGM(request: BGMGenerationRequest): Promise<BGMGenerationResponse> {
    try {
      // 時間帯を決定
      const timeOfDay = request.timeOfDay || getTimeOfDay(new Date().getHours());
      const weatherCondition = request.weatherCondition || 'clear';

      // キャッシュキーを生成
      const cacheKey = `bgm:${timeOfDay}:${weatherCondition}`;

      // キャッシュチェック
      const cachedBGM = await cache.get<BGMGenerationResponse>(cacheKey);
      if (cachedBGM) {
        logger.info(`BGM retrieved from cache for ${timeOfDay} - ${weatherCondition}`);
        
        // DBに履歴を保存
        await this.saveBGMHistory(request.userId, cachedBGM);
        
        return cachedBGM;
      }

      // 音楽パラメータを取得
      const musicParams = getMusicParameters(timeOfDay, weatherCondition);

      // プロンプト生成
      const prompt = request.customPrompt || generateMusicPrompt(musicParams);

      // ElevenLabs APIで音楽生成
      const audioUrl = await this.callElevenLabsAPI(prompt, request.durationSeconds || 180);

      // レスポンス作成
      const response: BGMGenerationResponse = {
        id: this.generateId(),
        audioUrl,
        prompt,
        timeOfDay,
        weatherCondition,
        musicParameters: {
          mood: musicParams.mood,
          instruments: musicParams.instruments,
          bpm: `${musicParams.bpmRange[0]}-${musicParams.bpmRange[1]}`,
          key: musicParams.key,
          energy: musicParams.energy,
        },
        generatedAt: new Date(),
      };

      // キャッシュに保存
      await cache.set(cacheKey, response, CACHE_TTL);

      // DBに履歴を保存
      await this.saveBGMHistory(request.userId, response);

      logger.info(`BGM generated successfully for ${timeOfDay} - ${weatherCondition}`);

      return response;
    } catch (error) {
      logger.error('Error generating BGM:', error);
      throw new Error('Failed to generate BGM');
    }
  }

  /**
   * ElevenLabs API呼び出し
   */
  private async callElevenLabsAPI(
    prompt: string,
    durationSeconds: number
  ): Promise<string> {
    try {
      if (!ELEVENLABS_API_KEY) {
        // 開発環境用のダミーURL（API keyがない場合）
        logger.warn('ElevenLabs API key not configured, returning demo URL');
        return 'https://example.com/demo-audio.mp3';
      }

      const response = await axios.post(
        `${ELEVENLABS_API_URL}/music/generate`,
        {
          text: prompt,
          duration_seconds: durationSeconds,
          model_id: 'eleven_music_v1',
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2分タイムアウト
        }
      );

      // ElevenLabsのレスポンスから音楽URLを取得
      // 実際のAPIレスポンス構造に応じて調整が必要
      const audioUrl = response.data.audio_url || response.data.url;

      if (!audioUrl) {
        throw new Error('No audio URL in ElevenLabs response');
      }

      return audioUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('ElevenLabs API error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error('ElevenLabs API error:', error);
      }
      throw new Error('Failed to call ElevenLabs API');
    }
  }

  /**
   * BGM履歴をDBに保存
   */
  private async saveBGMHistory(
    userId: string,
    bgmData: BGMGenerationResponse
  ): Promise<void> {
    try {
      await prisma.generatedBGM.create({
        data: {
          userId,
          audioUrl: bgmData.audioUrl,
          prompt: bgmData.prompt,
          timeOfDay: bgmData.timeOfDay,
          weatherCondition: bgmData.weatherCondition,
          musicParameters: bgmData.musicParameters as any,
          generatedAt: bgmData.generatedAt,
        },
      });
    } catch (error) {
      // 履歴保存エラーは致命的ではないのでログのみ
      logger.error('Error saving BGM history:', error);
    }
  }

  /**
   * ユーザーのBGM履歴を取得
   */
  async getUserBGMHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const history = await prisma.generatedBGM.findMany({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          audioUrl: true,
          prompt: true,
          timeOfDay: true,
          weatherCondition: true,
          musicParameters: true,
          generatedAt: true,
        },
      });

      return history;
    } catch (error) {
      logger.error('Error fetching BGM history:', error);
      throw new Error('Failed to fetch BGM history');
    }
  }

  /**
   * 特定のBGMを取得
   */
  async getBGMById(bgmId: string): Promise<any> {
    try {
      const bgm = await prisma.generatedBGM.findUnique({
        where: { id: bgmId },
        select: {
          id: true,
          audioUrl: true,
          prompt: true,
          timeOfDay: true,
          weatherCondition: true,
          musicParameters: true,
          generatedAt: true,
        },
      });

      if (!bgm) {
        throw new Error('BGM not found');
      }

      return bgm;
    } catch (error) {
      logger.error('Error fetching BGM:', error);
      throw error;
    }
  }

  /**
   * ランダムなIDを生成
   */
  private generateId(): string {
    return `bgm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const musicGeneratorService = new MusicGeneratorService();
