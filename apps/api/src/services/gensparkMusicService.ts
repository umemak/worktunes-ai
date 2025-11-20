import { BGMRequest, BGMResponse, EnvironmentData } from '@worktunes/types';
import { logger } from '../utils/logger';

/**
 * Genspark音楽生成サービス
 * Gensparkのaudio_generation toolを活用してBGMを生成
 */
export class GensparkMusicService {
  private readonly gensparkApiUrl: string;
  private readonly gensparkToken: string;

  constructor() {
    this.gensparkApiUrl = process.env.GENSPARK_API_URL || 'https://api.genspark.ai';
    this.gensparkToken = process.env.GENSPARK_TOKEN || '';
  }

  /**
   * 環境とワークタイプに基づいてBGMを生成
   */
  async generateBGM(request: BGMRequest): Promise<BGMResponse> {
    try {
      logger.info('Starting BGM generation with Genspark', { 
        workType: request.workType,
        timeOfDay: request.environment.timeOfDay,
        weather: request.environment.weather.condition
      });

      // 1. 最適なモデルを選択
      const selectedModel = this.selectOptimalModel(request.environment, request.workType);
      
      // 2. プロンプトを構築
      const musicPrompt = this.buildMusicPrompt(request);
      
      // 3. Genspark音楽生成を実行
      const gensparkResult = await this.callGensparkAudioGeneration({
        model: selectedModel,
        query: musicPrompt,
        duration: request.duration,
        task_summary: `BGM generation for ${request.workType} work during ${request.environment.timeOfDay} ${request.environment.weather.condition} weather`
      });

      // 4. Gensparkレスポンスを標準形式に変換
      const bgmResponse = this.convertToStandardResponse(gensparkResult, request);
      
      logger.info('BGM generation completed successfully', { 
        bgmId: bgmResponse.id,
        model: selectedModel,
        duration: bgmResponse.metadata.duration
      });

      return bgmResponse;

    } catch (error) {
      logger.error('BGM generation failed', error);
      throw new Error(`Music generation failed: ${error.message}`);
    }
  }

  /**
   * 環境とワークタイプに応じて最適なGensparkモデルを選択
   */
  private selectOptimalModel(environment: EnvironmentData, workType: string): string {
    const { timeOfDay, weather } = environment;
    
    // 集中作業用
    if (workType === 'focus') {
      if (weather.condition === 'rainy') {
        return 'fal-ai/lyria2'; // 雨音との相性が良いアンビエント
      }
      return 'mureka/instrumental-generator'; // インストゥルメンタル特化
    }
    
    // クリエイティブ作業用
    if (workType === 'creative') {
      if (timeOfDay === 'morning') {
        return 'elevenlabs/v3-tts'; // 朝のインスピレーション音楽
      }
      return 'mureka/song-generator'; // メロディアスな楽曲
    }
    
    // リラックス用
    if (workType === 'relaxed') {
      return 'fal-ai/lyria2'; // 癒し系アンビエント
    }
    
    // エネルギッシュ用
    if (workType === 'energetic') {
      return 'fal-ai/minimax-music/v2'; // アップテンポ楽曲
    }
    
    // デフォルト
    return 'elevenlabs/v3-tts';
  }

  /**
   * BGM生成用のプロンプトを構築
   */
  private buildMusicPrompt(request: BGMRequest): string {
    const { environment, workType, genre, mood } = request;
    
    const basePrompt = this.getBasePromptForWorkType(workType);
    const environmentContext = this.getEnvironmentContext(environment);
    const styleModifiers = this.getStyleModifiers(genre, mood);
    
    const prompt = [
      basePrompt,
      environmentContext,
      styleModifiers,
      'instrumental only, no vocals, seamless loop suitable for background listening',
      `duration: ${request.duration} seconds`
    ].filter(Boolean).join(', ');

    return prompt;
  }

  /**
   * 作業タイプ別の基本プロンプト
   */
  private getBasePromptForWorkType(workType: string): string {
    switch (workType) {
      case 'focus':
        return 'concentration-enhancing background music, minimal distraction, steady rhythm';
      case 'creative':
        return 'inspiring creative music, melodious and uplifting, stimulating imagination';
      case 'relaxed':
        return 'relaxing ambient music, slow tempo, calming and peaceful';
      case 'energetic':
        return 'energetic background music, upbeat tempo, motivating and dynamic';
      default:
        return 'neutral background music, balanced tempo';
    }
  }

  /**
   * 環境（時間帯・天気）コンテキスト
   */
  private getEnvironmentContext(environment: EnvironmentData): string {
    const { timeOfDay, weather } = environment;
    
    const timeContext = {
      morning: 'fresh morning atmosphere',
      afternoon: 'productive afternoon energy',
      evening: 'gentle evening mood',
      night: 'quiet nighttime ambiance',
      lateNight: 'deep night tranquility'
    }[timeOfDay] || 'neutral time';

    const weatherContext = {
      sunny: 'bright and cheerful like sunny weather',
      cloudy: 'soft and mellow like cloudy skies',
      rainy: 'contemplative and cozy like gentle rain',
      snowy: 'serene and pure like falling snow',
      stormy: 'dramatic yet comforting'
    }[weather.condition] || 'weather-neutral';

    return `${timeContext}, ${weatherContext}`;
  }

  /**
   * スタイル修飾子（ジャンル・ムード）
   */
  private getStyleModifiers(genre?: string[], mood?: string): string {
    const modifiers: string[] = [];
    
    if (genre && genre.length > 0) {
      modifiers.push(`genres: ${genre.join(', ')}`);
    }
    
    if (mood) {
      const moodDescriptors = {
        calm: 'tranquil and peaceful',
        upbeat: 'lively and positive',
        meditative: 'deep and contemplative', 
        inspiring: 'uplifting and motivational'
      };
      modifiers.push(moodDescriptors[mood] || mood);
    }
    
    return modifiers.join(', ');
  }

  /**
   * Genspark audio_generation tool を呼び出し
   */
  private async callGensparkAudioGeneration(params: {
    model: string;
    query: string;
    duration: number;
    task_summary: string;
  }): Promise<any> {
    // TODO: 実際のGenspark API統合実装
    // 現在はモックレスポンスを返す
    
    logger.info('Calling Genspark audio generation', params);
    
    // Gensparkのaudio_generation toolの呼び出し
    // 実装例：
    /*
    const response = await fetch(`${this.gensparkApiUrl}/tools/audio_generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.gensparkToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model,
        query: params.query,
        duration: params.duration,
        task_summary: params.task_summary,
        file_name: `bgm_${Date.now()}.mp3`
      })
    });
    
    if (!response.ok) {
      throw new Error(`Genspark API error: ${response.statusText}`);
    }
    
    return await response.json();
    */
    
    // モックレスポンス（開発用）
    return {
      generated_audios: [{
        audio_url: `/audio/generated_${Date.now()}.mp3`,
        duration: params.duration,
        metadata: {
          model: params.model,
          prompt: params.query,
          quality: 'high'
        }
      }]
    };
  }

  /**
   * Gensparkレスポンスを標準BGMResponseに変換
   */
  private convertToStandardResponse(gensparkResult: any, request: BGMRequest): BGMResponse {
    const audio = gensparkResult.generated_audios[0];
    
    return {
      id: this.generateBGMId(),
      audioUrl: audio.audio_url,
      metadata: {
        title: this.generateTitle(request),
        duration: audio.duration,
        genre: request.genre?.join(', ') || 'ambient',
        bpm: this.estimateBPM(request),
        key: this.selectMusicalKey(request.environment),
        mood: request.mood || 'neutral'
      },
      generatedAt: new Date(),
      environment: request.environment
    };
  }

  /**
   * ユニークなBGM IDを生成
   */
  private generateBGMId(): string {
    return `bgm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * BGMタイトルを生成
   */
  private generateTitle(request: BGMRequest): string {
    const { workType, environment } = request;
    const timeOfDay = environment.timeOfDay.charAt(0).toUpperCase() + environment.timeOfDay.slice(1);
    const weather = environment.weather.condition.charAt(0).toUpperCase() + environment.weather.condition.slice(1);
    
    return `${timeOfDay} ${weather} - ${workType.charAt(0).toUpperCase() + workType.slice(1)} BGM`;
  }

  /**
   * BPM推定
   */
  private estimateBPM(request: BGMRequest): number {
    const baseBPM = {
      focus: 80,
      creative: 95,
      relaxed: 70,
      energetic: 110
    }[request.workType] || 85;

    // 天気による微調整
    const weatherModifier = {
      sunny: 10,
      cloudy: 0, 
      rainy: -10,
      snowy: -5,
      stormy: 5
    }[request.environment.weather.condition] || 0;

    return Math.max(60, Math.min(140, baseBPM + weatherModifier));
  }

  /**
   * 音楽キー選択
   */
  private selectMusicalKey(environment: EnvironmentData): string {
    const keys = {
      morning: ['C', 'G', 'D', 'F'],
      afternoon: ['C', 'F', 'Bb'],
      evening: ['Am', 'Dm', 'Em'],
      night: ['Am', 'Fm', 'Cm'],
      lateNight: ['Fm', 'Cm', 'Abm']
    };
    
    const timeKeys = keys[environment.timeOfDay] || keys.morning;
    return timeKeys[Math.floor(Math.random() * timeKeys.length)];
  }
}

export default GensparkMusicService;