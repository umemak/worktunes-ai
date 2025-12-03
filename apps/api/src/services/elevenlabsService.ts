import axios from 'axios';
import { BGMRequest, BGMResponse } from '@worktunes/types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * ElevenLabs 音楽生成サービス
 * https://elevenlabs.io/docs/api-reference/text-to-sound-effects
 */
export class ElevenLabsService {
  private readonly apiUrl = 'https://api.elevenlabs.io/v1';
  private readonly apiKey: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 3000;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('ELEVENLABS_API_KEY not provided, ElevenLabs API calls will fail');
    }
  }

  /**
   * BGMを生成
   */
  async generateBGM(request: BGMRequest): Promise<BGMResponse> {
    try {
      logger.info('Starting ElevenLabs BGM generation', { 
        workType: request.workType,
        duration: request.duration 
      });

      // 環境適応プロンプトを構築
      const musicPrompt = this.buildMusicPrompt(request);
      
      // ElevenLabs APIを呼び出し
      const audioBuffer = await this.callElevenLabsAPI(musicPrompt, request.duration);
      
      // オーディオをBase64に変換
      const audioUrl = await this.saveAudioFile(audioBuffer);
      
      // レスポンスを構築
      const bgmResponse: BGMResponse = {
        id: uuidv4(),
        audioUrl: audioUrl,
        metadata: {
          title: this.generateTitle(request),
          duration: request.duration || 30,
          genre: this.inferGenre(request),
          mood: this.inferMood(request),
          instruments: this.inferInstruments(request),
          bpm: this.inferBPM(request),
          key: this.inferKey(request),
          energy: this.inferEnergy(request),
          generatedAt: new Date().toISOString()
        },
        generationParams: {
          prompt: musicPrompt,
          model: 'eleven_multilingual_v2',
          duration: request.duration || 30
        }
      };

      logger.info('ElevenLabs BGM generation completed', { 
        bgmId: bgmResponse.id,
        duration: bgmResponse.metadata.duration
      });

      return bgmResponse;

    } catch (error: any) {
      logger.error('ElevenLabs BGM generation failed', error);
      throw new Error(`Music generation failed: ${error.message}`);
    }
  }

  /**
   * ElevenLabs APIを呼び出し（リトライ機能付き）
   */
  private async callElevenLabsAPI(
    prompt: string, 
    duration: number = 30,
    retryCount = 0
  ): Promise<Buffer> {
    try {
      // ElevenLabs Text-to-Sound-Effects API
      const response = await axios.post(
        `${this.apiUrl}/text-to-sound-effects`,
        {
          text: prompt,
          duration_seconds: Math.min(duration, 30), // ElevenLabs v2は最大30秒
          prompt_influence: 0.3,
          looping: duration > 30 // 30秒以上の場合はループ可能な音楽を生成
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 60000 // 60秒タイムアウト
        }
      );

      return Buffer.from(response.data);

    } catch (error: any) {
      // リトライロジック
      if (error.response?.status === 429 && retryCount < this.maxRetries) {
        logger.warn(`Rate limit hit, retrying... (${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(this.retryDelay * (retryCount + 1));
        return this.callElevenLabsAPI(prompt, duration, retryCount + 1);
      }

      if (error.response?.status === 503 && retryCount < this.maxRetries) {
        logger.warn(`Service unavailable, retrying... (${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(this.retryDelay);
        return this.callElevenLabsAPI(prompt, duration, retryCount + 1);
      }

      // エラーレスポンスの詳細をログ
      if (error.response) {
        logger.error('ElevenLabs API error', {
          status: error.response.status,
          data: error.response.data
        });
      }

      throw error;
    }
  }

  /**
   * 環境適応型プロンプトを構築
   */
  private buildMusicPrompt(request: BGMRequest): string {
    const { environment, workType, mood, genre } = request;
    const { timeOfDay, weather } = environment;

    // 時間帯による音楽スタイル
    const timeStyles: Record<string, string> = {
      morning: 'bright morning ambience with gentle awakening melodies',
      afternoon: 'focused productive atmosphere with steady rhythms',
      evening: 'relaxing sunset vibes with warm harmonies',
      night: 'peaceful nighttime soundscape with calm tones',
      lateNight: 'deep night atmosphere with minimal subtle sounds'
    };

    // 天気による音楽スタイル
    const weatherStyles: Record<string, string> = {
      sunny: 'cheerful sunny day energy with uplifting tones',
      cloudy: 'contemplative overcast mood with balanced sounds',
      rainy: 'gentle rain ambience with soothing water sounds',
      snowy: 'serene winter atmosphere with crystalline textures',
      stormy: 'dramatic weather energy with powerful elements'
    };

    // 作業タイプによる音楽スタイル
    const workStyles: Record<string, string> = {
      focus: 'concentration-enhancing lo-fi beats with minimal distractions',
      creative: 'inspiring creative flow with dynamic progressions',
      relaxed: 'calm ambient soundscape for relaxation',
      energetic: 'upbeat motivational music with driving rhythms'
    };

    const timeStyle = timeStyles[timeOfDay] || 'balanced atmosphere';
    const weatherStyle = weatherStyles[weather.condition] || 'neutral mood';
    const workStyle = workStyles[workType] || 'instrumental background music';

    // ElevenLabs向けの自然言語プロンプト
    const prompt = `Create ${genre || 'instrumental'} background music for work. ${workStyle}, ${timeStyle}, ${weatherStyle}. ${mood || 'calm'} mood, professional quality, seamless loop, no vocals.`;

    logger.debug('Generated ElevenLabs prompt', { prompt });

    return prompt;
  }

  /**
   * オーディオファイルを保存（Base64データURLとして返す）
   */
  private async saveAudioFile(audioBuffer: Buffer): Promise<string> {
    // 本番環境ではS3などのストレージに保存
    // 開発環境ではBase64データURLとして返す
    const base64Audio = audioBuffer.toString('base64');
    return `data:audio/mpeg;base64,${base64Audio}`;
  }

  /**
   * タイトル生成
   */
  private generateTitle(request: BGMRequest): string {
    const { environment, workType } = request;
    const time = environment.timeOfDay.charAt(0).toUpperCase() + environment.timeOfDay.slice(1);
    const weather = environment.weather.condition.charAt(0).toUpperCase() + environment.weather.condition.slice(1);
    const work = workType.charAt(0).toUpperCase() + workType.slice(1);
    
    return `${time} ${weather} - ${work} Soundscape`;
  }

  /**
   * ジャンル推定
   */
  private inferGenre(request: BGMRequest): string {
    const genreMap: Record<string, string> = {
      focus: 'Lo-fi / Ambient',
      creative: 'Cinematic / Electronic',
      relaxed: 'Ambient / Nature',
      energetic: 'Electronic / Pop'
    };
    return request.genre || genreMap[request.workType] || 'Ambient';
  }

  /**
   * ムード推定
   */
  private inferMood(request: BGMRequest): string {
    const moodMap: Record<string, string> = {
      morning: 'Fresh & Energetic',
      afternoon: 'Focused & Steady',
      evening: 'Warm & Relaxed',
      night: 'Calm & Peaceful',
      lateNight: 'Deep & Serene'
    };
    return request.mood || moodMap[request.environment.timeOfDay] || 'Balanced';
  }

  /**
   * 楽器推定
   */
  private inferInstruments(request: BGMRequest): string[] {
    const instrumentMap: Record<string, string[]> = {
      focus: ['Piano', 'Soft Synth', 'Ambient Pads', 'Light Percussion'],
      creative: ['Strings', 'Synth', 'Piano', 'Atmospheric Effects'],
      relaxed: ['Nature Sounds', 'Soft Piano', 'Ambient Textures', 'Gentle Chimes'],
      energetic: ['Electronic Drums', 'Bass', 'Synth Lead', 'Rhythmic Elements']
    };
    return request.instruments || instrumentMap[request.workType] || ['Ambient Sounds'];
  }

  /**
   * BPM推定
   */
  private inferBPM(request: BGMRequest): number {
    const bpmMap: Record<string, number> = {
      focus: 75,
      creative: 90,
      relaxed: 60,
      energetic: 110
    };
    return request.bpm || bpmMap[request.workType] || 80;
  }

  /**
   * キー推定
   */
  private inferKey(request: BGMRequest): string {
    const keyMap: Record<string, string> = {
      morning: 'D Major',
      afternoon: 'C Major',
      evening: 'A Minor',
      night: 'E Minor',
      lateNight: 'F Minor'
    };
    return keyMap[request.environment.timeOfDay] || 'C Major';
  }

  /**
   * エネルギーレベル推定
   */
  private inferEnergy(request: BGMRequest): number {
    const energyMap: Record<string, number> = {
      focus: 0.4,
      creative: 0.6,
      relaxed: 0.2,
      energetic: 0.8
    };
    return energyMap[request.workType] || 0.5;
  }

  /**
   * スリープユーティリティ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    try {
      // ElevenLabs User API でヘルスチェック
      const response = await axios.get(`${this.apiUrl}/user`, {
        headers: { 'xi-api-key': this.apiKey },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('ElevenLabs health check failed', error);
      return false;
    }
  }

  /**
   * 利用可能なクレジット確認
   */
  async getCredits(): Promise<{ character_count: number; character_limit: number }> {
    try {
      const response = await axios.get(`${this.apiUrl}/user/subscription`, {
        headers: { 'xi-api-key': this.apiKey }
      });
      return {
        character_count: response.data.character_count || 0,
        character_limit: response.data.character_limit || 0
      };
    } catch (error) {
      logger.error('Failed to get ElevenLabs credits', error);
      throw error;
    }
  }
}

export default ElevenLabsService;
