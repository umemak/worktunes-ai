import axios from 'axios';
import { BGMRequest, BGMResponse } from '@worktunes/types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * MusicGen (Hugging Face) 音楽生成サービス
 */
export class MusicGenService {
  private readonly apiUrl = 'https://api-inference.huggingface.co/models/facebook/musicgen-small';
  private readonly apiToken: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5秒

  constructor() {
    this.apiToken = process.env.HUGGINGFACE_API_TOKEN || '';
    
    if (!this.apiToken) {
      logger.warn('HUGGINGFACE_API_TOKEN not provided, MusicGen API calls will fail');
    }
  }

  /**
   * BGMを生成
   */
  async generateBGM(request: BGMRequest): Promise<BGMResponse> {
    try {
      logger.info('Starting MusicGen BGM generation', { 
        workType: request.workType,
        duration: request.duration 
      });

      // 環境適応プロンプトを構築
      const musicPrompt = this.buildMusicPrompt(request);
      
      // MusicGen APIを呼び出し
      const audioBuffer = await this.callMusicGenAPI(musicPrompt);
      
      // オーディオをBase64に変換（または一時ファイルとして保存）
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
          key: 'C Major',
          energy: this.inferEnergy(request),
          generatedAt: new Date().toISOString()
        },
        generationParams: {
          prompt: musicPrompt,
          model: 'facebook/musicgen-small',
          duration: request.duration || 30
        }
      };

      logger.info('MusicGen BGM generation completed', { 
        bgmId: bgmResponse.id,
        duration: bgmResponse.metadata.duration
      });

      return bgmResponse;

    } catch (error: any) {
      logger.error('MusicGen BGM generation failed', error);
      throw new Error(`Music generation failed: ${error.message}`);
    }
  }

  /**
   * MusicGen APIを呼び出し（リトライ機能付き）
   */
  private async callMusicGenAPI(prompt: string, retryCount = 0): Promise<Buffer> {
    try {
      const response = await axios.post(
        this.apiUrl,
        { inputs: prompt },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 120000 // 2分タイムアウト
        }
      );

      // レスポンスがJSONエラーの場合
      if (response.headers['content-type']?.includes('application/json')) {
        const errorData = JSON.parse(Buffer.from(response.data).toString());
        
        // モデルがロード中の場合はリトライ
        if (errorData.error?.includes('loading') && retryCount < this.maxRetries) {
          const estimatedTime = errorData.estimated_time || this.retryDelay / 1000;
          logger.info(`Model is loading, retrying in ${estimatedTime} seconds...`);
          await this.sleep(estimatedTime * 1000);
          return this.callMusicGenAPI(prompt, retryCount + 1);
        }
        
        throw new Error(errorData.error || 'Unknown API error');
      }

      return Buffer.from(response.data);

    } catch (error: any) {
      if (error.response?.status === 503 && retryCount < this.maxRetries) {
        logger.warn(`API temporarily unavailable, retrying... (${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(this.retryDelay);
        return this.callMusicGenAPI(prompt, retryCount + 1);
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
      morning: 'uplifting, fresh, energetic',
      afternoon: 'focused, steady, moderate tempo',
      evening: 'relaxing, warm, mellow',
      night: 'calm, peaceful, ambient',
      lateNight: 'soft, minimal, atmospheric'
    };

    // 天気による音楽スタイル
    const weatherStyles: Record<string, string> = {
      sunny: 'bright, cheerful, optimistic',
      cloudy: 'contemplative, neutral, balanced',
      rainy: 'gentle, soothing, with soft rain sounds',
      snowy: 'serene, pure, crystalline',
      stormy: 'dramatic, intense, powerful'
    };

    // 作業タイプによる音楽スタイル
    const workStyles: Record<string, string> = {
      focus: 'lo-fi, minimal percussion, steady rhythm',
      creative: 'inspiring, flowing, dynamic',
      relaxed: 'ambient, spacious, slow tempo',
      energetic: 'upbeat, motivating, driving rhythm'
    };

    const timeStyle = timeStyles[timeOfDay] || 'balanced';
    const weatherStyle = weatherStyles[weather.condition] || 'neutral';
    const workStyle = workStyles[workType] || 'instrumental';

    // プロンプトを組み立て
    const prompt = `${genre || 'instrumental'} music, ${workStyle}, ${timeStyle}, ${weatherStyle}, ${mood || 'calm'}, high quality, no vocals`;

    logger.debug('Generated MusicGen prompt', { prompt });

    return prompt;
  }

  /**
   * オーディオファイルを保存（Base64データURLとして返す）
   */
  private async saveAudioFile(audioBuffer: Buffer): Promise<string> {
    // 本番環境ではS3などのストレージに保存
    // 開発環境ではBase64データURLとして返す
    const base64Audio = audioBuffer.toString('base64');
    return `data:audio/wav;base64,${base64Audio}`;
  }

  /**
   * タイトル生成
   */
  private generateTitle(request: BGMRequest): string {
    const { environment, workType } = request;
    const time = environment.timeOfDay.charAt(0).toUpperCase() + environment.timeOfDay.slice(1);
    const weather = environment.weather.condition.charAt(0).toUpperCase() + environment.weather.condition.slice(1);
    const work = workType.charAt(0).toUpperCase() + workType.slice(1);
    
    return `${time} ${weather} - ${work} BGM`;
  }

  /**
   * ジャンル推定
   */
  private inferGenre(request: BGMRequest): string {
    const genreMap: Record<string, string> = {
      focus: 'Lo-fi',
      creative: 'Ambient Electronic',
      relaxed: 'Ambient',
      energetic: 'Electronic'
    };
    return request.genre || genreMap[request.workType] || 'Instrumental';
  }

  /**
   * ムード推定
   */
  private inferMood(request: BGMRequest): string {
    const moodMap: Record<string, string> = {
      morning: 'Uplifting',
      afternoon: 'Focused',
      evening: 'Relaxed',
      night: 'Calm',
      lateNight: 'Peaceful'
    };
    return request.mood || moodMap[request.environment.timeOfDay] || 'Neutral';
  }

  /**
   * 楽器推定
   */
  private inferInstruments(request: BGMRequest): string[] {
    const instrumentMap: Record<string, string[]> = {
      focus: ['Piano', 'Synthesizer', 'Light Percussion'],
      creative: ['Synth Pad', 'Piano', 'Strings'],
      relaxed: ['Ambient Pad', 'Soft Piano', 'Nature Sounds'],
      energetic: ['Electronic Drums', 'Bass', 'Synthesizer']
    };
    return request.instruments || instrumentMap[request.workType] || ['Piano'];
  }

  /**
   * BPM推定
   */
  private inferBPM(request: BGMRequest): number {
    const bpmMap: Record<string, number> = {
      focus: 80,
      creative: 95,
      relaxed: 65,
      energetic: 120
    };
    return request.bpm || bpmMap[request.workType] || 90;
  }

  /**
   * エネルギーレベル推定
   */
  private inferEnergy(request: BGMRequest): number {
    const energyMap: Record<string, number> = {
      focus: 0.5,
      creative: 0.6,
      relaxed: 0.3,
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
      const response = await axios.get(this.apiUrl, {
        headers: { 'Authorization': `Bearer ${this.apiToken}` },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('MusicGen health check failed', error);
      return false;
    }
  }
}

export default MusicGenService;
