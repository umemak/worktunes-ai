import { BGMRequest, BGMResponse, EnvironmentData } from '@worktunes/types';
import { logger } from '../utils/logger';
import gensparkConfig from '../config/genspark';

/**
 * Genspark音楽生成サービス - 完全実装版
 */
export class GensparkMusicService {
  private readonly gensparkApiUrl: string;
  private readonly gensparkToken: string;

  constructor() {
    this.gensparkApiUrl = process.env.GENSPARK_API_URL || gensparkConfig.apiUrl;
    this.gensparkToken = process.env.GENSPARK_TOKEN || '';
    
    if (!this.gensparkToken) {
      logger.warn('GENSPARK_TOKEN not provided, API calls will use mock responses');
    }
  }

  /**
   * 環境とワークタイプに基づいてBGMを生成
   */
  async generateBGM(request: BGMRequest): Promise<BGMResponse> {
    try {
      logger.info('Starting Genspark BGM generation', { 
        workType: request.workType,
        timeOfDay: request.environment.timeOfDay,
        weather: request.environment.weather.condition
      });

      // 1. 最適なGensparkモデルを選択
      const selectedModel = this.selectOptimalGensparkModel(request.environment, request.workType);
      
      // 2. 環境適応プロンプトを構築
      const musicPrompt = this.buildEnvironmentAdaptivePrompt(request);
      
      // 3. Genspark audio_generation を実行
      const gensparkResult = await this.callGensparkAudioGeneration({
        model: selectedModel,
        query: musicPrompt,
        duration: request.duration,
        task_summary: `WorkTunes BGM: ${request.workType} work during ${request.environment.timeOfDay} with ${request.environment.weather.condition} weather`
      });

      // 4. レスポンスを標準形式に変換
      const bgmResponse = this.convertGensparkToStandardResponse(gensparkResult, request, selectedModel);
      
      logger.info('Genspark BGM generation completed', { 
        bgmId: bgmResponse.id,
        model: selectedModel,
        duration: bgmResponse.metadata.duration
      });

      return bgmResponse;

    } catch (error) {
      logger.error('Genspark BGM generation failed', error);
      throw new Error(`Music generation failed: ${error.message}`);
    }
  }

  /**
   * 環境とワークタイプに応じて最適なGensparkモデルを選択
   */
  private selectOptimalGensparkModel(environment: EnvironmentData, workType: string): string {
    const { timeOfDay, weather } = environment;
    
    // 基本モデル選択（作業タイプ別）
    const baseModel = gensparkConfig.modelMapping[workType]?.primary || 'elevenlabs/v3-tts';
    
    // 環境条件による調整
    if (workType === 'focus') {
      if (weather.condition === 'rainy') {
        return 'fal-ai/lyria2'; // 雨音との相性抜群
      }
      if (timeOfDay === 'lateNight') {
        return 'mureka/instrumental-generator'; // 深夜集中用
      }
      return baseModel;
    }
    
    if (workType === 'creative') {
      if (timeOfDay === 'morning' && weather.condition === 'sunny') {
        return 'elevenlabs/v3-tts'; // 朝の創作活動
      }
      if (weather.condition === 'stormy') {
        return 'mureka/song-generator'; // ドラマチックな創作
      }
      return baseModel;
    }
    
    if (workType === 'relaxed') {
      return 'fal-ai/lyria2'; // 常にアンビエント系
    }
    
    if (workType === 'energetic') {
      if (timeOfDay === 'afternoon') {
        return 'fal-ai/minimax-music/v2'; // 午後の活力
      }
      return baseModel;
    }
    
    return baseModel;
  }

  /**
   * 環境適応型プロンプト構築
   */
  private buildEnvironmentAdaptivePrompt(request: BGMRequest): string {
    const { environment, workType, genre, mood } = request;
    
    // 基本作業タイプ記述
    const workTypeDescription = this.getWorkTypeDescription(workType);
    
    // 環境コンテキスト
    const environmentContext = this.getEnvironmentContext(environment);
    
    // 音楽スタイル指定
    const musicStyle = this.getMusicStyle(environment, workType);
    
    // ジャンル・ムード追加
    const additionalModifiers = this.getAdditionalModifiers(genre, mood);
    
    // プロンプト組立
    const prompt = [
      workTypeDescription,
      environmentContext,
      musicStyle,
      additionalModifiers,
      'instrumental background music, no vocals, seamless loop',
      'professional quality, optimized for extended listening',
      `duration approximately ${request.duration} seconds`
    ].filter(Boolean).join(', ');

    logger.debug('Generated Genspark prompt', { prompt });
    return prompt;
  }

  /**
   * 作業タイプ記述
   */
  private getWorkTypeDescription(workType: string): string {
    const descriptions = {
      focus: 'concentration-enhancing background music with minimal distractions',
      creative: 'inspiring and uplifting music to stimulate creativity and imagination', 
      relaxed: 'calm and soothing ambient music for relaxation and stress relief',
      energetic: 'upbeat and motivating music to boost energy and productivity'
    };
    return descriptions[workType] || 'balanced background music';
  }

  /**
   * 環境コンテキスト（時間帯×天気）
   */
  private getEnvironmentContext(environment: EnvironmentData): string {
    const { timeOfDay, weather } = environment;
    
    const timeDescriptions = {
      morning: 'fresh morning atmosphere with gentle awakening energy',
      afternoon: 'productive afternoon ambiance with steady momentum', 
      evening: 'warm evening mood transitioning to relaxation',
      night: 'peaceful nighttime atmosphere with gentle tranquility',
      lateNight: 'deep night serenity with minimal stimulation'
    };
    
    const weatherDescriptions = {
      sunny: 'bright and cheerful like warm sunlight',
      cloudy: 'soft and contemplative like gentle overcast skies', 
      rainy: 'cozy and introspective like peaceful rainfall',
      snowy: 'pure and serene like falling snowflakes',
      stormy: 'dramatic yet comforting with underlying strength'
    };
    
    const timeContext = timeDescriptions[timeOfDay] || 'neutral temporal mood';
    const weatherContext = weatherDescriptions[weather.condition] || 'weather-independent';
    
    return `${timeContext}, ${weatherContext}`;
  }

  /**
   * 環境・作業タイプ別音楽スタイル
   */
  private getMusicStyle(environment: EnvironmentData, workType: string): string {
    const environmentStyle = gensparkConfig.environmentStyles[environment.timeOfDay]?.[environment.weather.condition];
    
    if (!environmentStyle) {
      return 'balanced tempo and harmonious arrangements';
    }
    
    const { energy, mood } = environmentStyle;
    
    const energyStyles = {
      'very-low': 'extremely gentle tempo around 60-70 BPM',
      'low': 'slow and steady tempo around 70-80 BPM',
      'low-medium': 'relaxed tempo around 80-90 BPM', 
      'medium': 'moderate tempo around 90-100 BPM',
      'medium-high': 'energetic tempo around 100-110 BPM',
      'high': 'upbeat tempo around 110-120 BPM'
    };
    
    const moodStyles = {
      uplifting: 'major keys with ascending melodies',
      gentle: 'soft dynamics with flowing harmonies',
      contemplative: 'minor keys with introspective progressions',
      focused: 'steady rhythms with minimal variation',
      balanced: 'harmonious blend of major and minor elements',
      meditative: 'sustained tones with peaceful progressions',
      calm: 'smooth textures with gentle transitions',
      cozy: 'warm timbres with intimate arrangements',
      peaceful: 'tranquil harmonies with spacious arrangements',
      ambient: 'atmospheric textures with minimal rhythmic elements',
      tranquil: 'serene soundscapes with natural flow',
      soothing: 'comforting melodies with stable foundations'
    };
    
    const energyDesc = energyStyles[energy] || 'moderate tempo';
    const moodDesc = moodStyles[mood] || 'balanced harmonies';
    
    return `${energyDesc}, ${moodDesc}`;
  }

  /**
   * 追加修飾子（ジャンル・ムード）
   */
  private getAdditionalModifiers(genre?: string[], mood?: string): string {
    const modifiers: string[] = [];
    
    if (genre && genre.length > 0) {
      modifiers.push(`incorporating elements from: ${genre.join(', ')}`);
    }
    
    if (mood) {
      const moodModifiers = {
        calm: 'with tranquil and peaceful qualities',
        upbeat: 'with lively and positive energy',
        meditative: 'with deep contemplative atmosphere',
        inspiring: 'with uplifting and motivational character'
      };
      modifiers.push(moodModifiers[mood] || `with ${mood} characteristics`);
    }
    
    return modifiers.join(', ');
  }

  /**
   * Genspark audio_generation API呼び出し
   */
  private async callGensparkAudioGeneration(params: {
    model: string;
    query: string;
    duration: number;
    task_summary: string;
  }): Promise<any> {
    
    if (!this.gensparkToken) {
      logger.warn('No Genspark token, returning mock response');
      return this.getMockGensparkResponse(params);
    }
    
    try {
      logger.info('Calling Genspark audio_generation', {
        model: params.model,
        duration: params.duration
      });
      
      const response = await fetch(`${this.gensparkApiUrl}/audio/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.gensparkToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WorkTunes-AI/1.0'
        },
        body: JSON.stringify({
          model: params.model,
          query: params.query,
          duration: params.duration,
          task_summary: params.task_summary,
          file_name: `worktunes_${Date.now()}.mp3`,
          requirements: this.buildAudioRequirements()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Genspark API ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.generated_audios || result.generated_audios.length === 0) {
        throw new Error('Genspark returned empty audio result');
      }
      
      logger.info('Genspark generation successful', {
        model: params.model,
        audioUrl: result.generated_audios[0].audio_url
      });
      
      return result;
      
    } catch (error) {
      logger.error('Genspark API call failed', error);
      
      // 開発環境ではモックを返す
      if (process.env.NODE_ENV === 'development') {
        logger.info('Falling back to mock response for development');
        return this.getMockGensparkResponse(params);
      }
      
      throw error;
    }
  }

  /**
   * オーディオ要件
   */
  private buildAudioRequirements(): string {
    return [
      'High-quality stereo audio (44.1kHz, 16-bit minimum)',
      'Seamless looping capability for continuous playback',
      'Balanced frequency response optimized for speakers and headphones', 
      'Consistent volume levels without sudden changes',
      'Professional mastering suitable for work environments',
      'No abrupt starts or endings'
    ].join('. ');
  }

  /**
   * モックレスポンス生成
   */
  private getMockGensparkResponse(params: any): any {
    return {
      generated_audios: [{
        audio_url: `https://worktunesai-demo.s3.amazonaws.com/mock_${params.model.replace('/', '_')}_${Date.now()}.mp3`,
        duration: params.duration,
        metadata: {
          model: params.model,
          prompt: params.query,
          quality: 'high',
          sample_rate: 44100,
          format: 'mp3',
          mock: true
        }
      }]
    };
  }

  /**
   * Gensparkレスポンス → 標準BGMResponse変換
   */
  private convertGensparkToStandardResponse(
    gensparkResult: any, 
    request: BGMRequest, 
    modelUsed: string
  ): BGMResponse {
    const audio = gensparkResult.generated_audios[0];
    
    return {
      id: `bgm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audioUrl: audio.audio_url,
      metadata: {
        title: this.generateContextualTitle(request),
        duration: audio.duration || request.duration,
        genre: this.inferGenre(request, modelUsed),
        bpm: this.estimateContextualBPM(request),
        key: this.selectMusicalKey(request.environment),
        mood: this.inferMood(request)
      },
      generatedAt: new Date(),
      environment: request.environment
    };
  }

  /**
   * コンテキスト考慮タイトル生成
   */
  private generateContextualTitle(request: BGMRequest): string {
    const { workType, environment } = request;
    
    const timeEmoji = {
      morning: '🌅',
      afternoon: '☀️', 
      evening: '🌆',
      night: '🌙',
      lateNight: '⭐'
    }[environment.timeOfDay] || '';
    
    const weatherEmoji = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      stormy: '⛈️'
    }[environment.weather.condition] || '';
    
    const workTypeNames = {
      focus: 'Focus Session',
      creative: 'Creative Flow', 
      relaxed: 'Relaxation Time',
      energetic: 'Energy Boost'
    };
    
    return `${timeEmoji}${weatherEmoji} ${workTypeNames[workType] || workType} - ${environment.timeOfDay.charAt(0).toUpperCase() + environment.timeOfDay.slice(1)} BGM`;
  }

  /**
   * ジャンル推定
   */
  private inferGenre(request: BGMRequest, modelUsed: string): string {
    if (request.genre && request.genre.length > 0) {
      return request.genre.join(', ');
    }
    
    // モデル別デフォルトジャンル
    const modelGenres = {
      'mureka/instrumental-generator': 'Instrumental',
      'fal-ai/lyria2': 'Ambient',
      'elevenlabs/v3-tts': 'Contemporary',
      'fal-ai/minimax-music/v2': 'Electronic'
    };
    
    return modelGenres[modelUsed] || 'Background Music';
  }

  /**
   * コンテキストBPM推定
   */
  private estimateContextualBPM(request: BGMRequest): number {
    const baseBPM = {
      focus: 85,
      creative: 95,
      relaxed: 72,
      energetic: 108
    }[request.workType] || 90;

    // 時間帯調整
    const timeModifier = {
      morning: 5,
      afternoon: 8,
      evening: -5,
      night: -10,
      lateNight: -15
    }[request.environment.timeOfDay] || 0;

    // 天気調整  
    const weatherModifier = {
      sunny: 8,
      cloudy: 0,
      rainy: -12,
      snowy: -8,
      stormy: 3
    }[request.environment.weather.condition] || 0;

    return Math.max(60, Math.min(130, baseBPM + timeModifier + weatherModifier));
  }

  /**
   * 音楽キー選択
   */
  private selectMusicalKey(environment: EnvironmentData): string {
    const keysByTime = {
      morning: ['C major', 'G major', 'D major', 'F major'],
      afternoon: ['C major', 'F major', 'Bb major', 'A minor'],
      evening: ['A minor', 'D minor', 'E minor', 'F major'], 
      night: ['A minor', 'F minor', 'C minor', 'G minor'],
      lateNight: ['F minor', 'C minor', 'Ab minor', 'D minor']
    };
    
    const keys = keysByTime[environment.timeOfDay] || keysByTime.morning;
    return keys[Math.floor(Math.random() * keys.length)];
  }

  /**
   * ムード推定
   */
  private inferMood(request: BGMRequest): string {
    if (request.mood) {
      return request.mood;
    }
    
    const { timeOfDay, weather } = request.environment;
    
    // 時間帯＋天気からムード推定
    if (timeOfDay === 'morning' && weather.condition === 'sunny') {
      return 'upbeat';
    }
    if (weather.condition === 'rainy') {
      return 'calm';
    }
    if (timeOfDay === 'lateNight') {
      return 'meditative';
    }
    if (request.workType === 'creative') {
      return 'inspiring';
    }
    
    return 'calm';
  }
}

export default GensparkMusicService;