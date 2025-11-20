/**
 * Genspark統合設定
 */
export const gensparkConfig = {
  apiUrl: process.env.GENSPARK_API_URL || 'https://api.genspark.ai',
  timeout: 120000, // 音楽生成は2分まで待機
  
  // 作業タイプ別推奨モデル
  modelMapping: {
    focus: {
      primary: 'mureka/instrumental-generator',
      fallback: 'fal-ai/lyria2'
    },
    creative: {
      primary: 'elevenlabs/v3-tts',
      fallback: 'mureka/song-generator'
    },
    relaxed: {
      primary: 'fal-ai/lyria2',
      fallback: 'elevenlabs/v3-tts'
    },
    energetic: {
      primary: 'fal-ai/minimax-music/v2',
      fallback: 'elevenlabs/v3-tts'
    }
  },

  // 環境条件による音楽スタイル調整
  environmentStyles: {
    morning: {
      sunny: { energy: 'medium-high', mood: 'uplifting' },
      cloudy: { energy: 'medium', mood: 'gentle' },
      rainy: { energy: 'low-medium', mood: 'contemplative' }
    },
    afternoon: {
      sunny: { energy: 'high', mood: 'focused' },
      cloudy: { energy: 'medium-high', mood: 'balanced' },
      rainy: { energy: 'medium', mood: 'meditative' }
    },
    evening: {
      sunny: { energy: 'medium', mood: 'relaxed' },
      cloudy: { energy: 'low-medium', mood: 'calm' },
      rainy: { energy: 'low', mood: 'cozy' }
    },
    night: {
      sunny: { energy: 'low-medium', mood: 'peaceful' },
      cloudy: { energy: 'low', mood: 'gentle' },
      rainy: { energy: 'low', mood: 'soothing' }
    },
    lateNight: {
      sunny: { energy: 'low', mood: 'ambient' },
      cloudy: { energy: 'very-low', mood: 'tranquil' },
      rainy: { energy: 'very-low', mood: 'meditative' }
    }
  },

  // デフォルト音楽パラメータ
  defaults: {
    duration: 180, // 3分
    quality: 'high',
    format: 'mp3'
  }
};

export default gensparkConfig;