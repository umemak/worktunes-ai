/**
 * 環境マッピングサービス
 * 時間帯と天気の組み合わせから最適な音楽パラメータを決定
 */

export type TimeOfDay = 'morning' | 'late_morning' | 'afternoon' | 'evening' | 'night';
export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'other';

export interface MusicParameters {
  mood: string;
  instruments: string[];
  bpmRange: [number, number];
  key: string[];
  energy: 'very-low' | 'low' | 'medium' | 'medium-high' | 'high';
  description: string;
}

export interface EnvironmentMapping {
  [key: string]: {
    [weather: string]: MusicParameters;
  };
}

/**
 * 時間帯と天気の環境マッピング
 */
export const environmentMoodMap: EnvironmentMapping = {
  morning: {
    clear: {
      mood: 'uplifting',
      instruments: ['piano', 'acoustic_guitar', 'strings'],
      bpmRange: [90, 120],
      key: ['C', 'G', 'D'],
      energy: 'medium-high',
      description: 'Bright and energizing morning music with sunny disposition',
    },
    clouds: {
      mood: 'gentle',
      instruments: ['acoustic_guitar', 'piano', 'soft_strings'],
      bpmRange: [75, 100],
      key: ['Am', 'Dm', 'Em'],
      energy: 'medium',
      description: 'Soft and soothing morning ambient music',
    },
    rain: {
      mood: 'calm',
      instruments: ['piano', 'ambient_pads', 'light_percussion'],
      bpmRange: [60, 85],
      key: ['Dm', 'Am', 'Gm'],
      energy: 'low',
      description: 'Peaceful rainy morning ambiance with gentle melodies',
    },
    snow: {
      mood: 'serene',
      instruments: ['strings', 'piano', 'bells'],
      bpmRange: [55, 80],
      key: ['F', 'Bb', 'Eb'],
      energy: 'low',
      description: 'Warm and cozy snowy morning atmosphere',
    },
    other: {
      mood: 'neutral',
      instruments: ['piano', 'strings'],
      bpmRange: [70, 95],
      key: ['C', 'Am'],
      energy: 'medium',
      description: 'Balanced morning background music',
    },
  },
  late_morning: {
    clear: {
      mood: 'focused',
      instruments: ['electronic', 'piano', 'light_percussion'],
      bpmRange: [100, 130],
      key: ['C', 'D', 'G'],
      energy: 'high',
      description: 'Productive and energetic work music for sunny late morning',
    },
    clouds: {
      mood: 'concentrated',
      instruments: ['piano', 'minimal_electronics', 'strings'],
      bpmRange: [90, 110],
      key: ['Am', 'Dm'],
      energy: 'medium-high',
      description: 'Focused ambient music for cloudy productivity',
    },
    rain: {
      mood: 'contemplative',
      instruments: ['lo-fi', 'piano', 'rain_sounds'],
      bpmRange: [70, 95],
      key: ['Dm', 'Gm', 'Cm'],
      energy: 'medium',
      description: 'Calm lo-fi beats with rain ambiance for concentration',
    },
    snow: {
      mood: 'introspective',
      instruments: ['classical', 'strings', 'woodwinds'],
      bpmRange: [65, 90],
      key: ['F', 'Bb'],
      energy: 'medium',
      description: 'Classical ambiance for snowy contemplation',
    },
    other: {
      mood: 'steady',
      instruments: ['piano', 'ambient'],
      bpmRange: [80, 105],
      key: ['C', 'G'],
      energy: 'medium',
      description: 'Steady focus music for late morning work',
    },
  },
  afternoon: {
    clear: {
      mood: 'energetic',
      instruments: ['upbeat_electronics', 'synth', 'drums'],
      bpmRange: [110, 140],
      key: ['C', 'D', 'A'],
      energy: 'high',
      description: 'High-energy afternoon boost with sunny vibes',
    },
    clouds: {
      mood: 'balanced',
      instruments: ['acoustic', 'light_electronics', 'piano'],
      bpmRange: [95, 115],
      key: ['G', 'Am', 'Dm'],
      energy: 'medium-high',
      description: 'Balanced afternoon work ambiance',
    },
    rain: {
      mood: 'meditative',
      instruments: ['ambient', 'soft_piano', 'rain_textures'],
      bpmRange: [60, 85],
      key: ['Dm', 'Am', 'Em'],
      energy: 'low',
      description: 'Meditative rainy afternoon soundscape',
    },
    snow: {
      mood: 'minimal',
      instruments: ['minimal_piano', 'strings', 'ambient'],
      bpmRange: [55, 80],
      key: ['Eb', 'Ab', 'Db'],
      energy: 'low',
      description: 'Minimal ambient music for snowy afternoon',
    },
    other: {
      mood: 'neutral',
      instruments: ['piano', 'ambient'],
      bpmRange: [85, 110],
      key: ['C', 'G', 'D'],
      energy: 'medium',
      description: 'Neutral afternoon background music',
    },
  },
  evening: {
    clear: {
      mood: 'relaxed',
      instruments: ['acoustic_guitar', 'piano', 'soft_synth'],
      bpmRange: [75, 100],
      key: ['G', 'C', 'D'],
      energy: 'medium',
      description: 'Relaxing evening wind-down music',
    },
    clouds: {
      mood: 'calm',
      instruments: ['piano', 'strings', 'ambient_pads'],
      bpmRange: [65, 90],
      key: ['Am', 'Dm', 'Em'],
      energy: 'low',
      description: 'Calm cloudy evening atmosphere',
    },
    rain: {
      mood: 'peaceful',
      instruments: ['jazz', 'piano', 'double_bass', 'rain'],
      bpmRange: [60, 85],
      key: ['Dm', 'Gm', 'Cm'],
      energy: 'low',
      description: 'Peaceful rainy evening jazz ambiance',
    },
    snow: {
      mood: 'cozy',
      instruments: ['warm_strings', 'piano', 'soft_woodwinds'],
      bpmRange: [55, 75],
      key: ['F', 'Bb', 'Eb'],
      energy: 'low',
      description: 'Cozy snowy evening warmth',
    },
    other: {
      mood: 'mellow',
      instruments: ['piano', 'acoustic'],
      bpmRange: [70, 95],
      key: ['C', 'G', 'Am'],
      energy: 'medium',
      description: 'Mellow evening background music',
    },
  },
  night: {
    clear: {
      mood: 'ambient',
      instruments: ['ambient_pads', 'soft_synth', 'minimal_piano'],
      bpmRange: [50, 70],
      key: ['Am', 'Dm', 'Em'],
      energy: 'very-low',
      description: 'Ambient nighttime soundscape',
    },
    clouds: {
      mood: 'dreamy',
      instruments: ['drone', 'ambient', 'soft_textures'],
      bpmRange: [45, 65],
      key: ['Dm', 'Gm'],
      energy: 'very-low',
      description: 'Dreamy cloudy night ambiance',
    },
    rain: {
      mood: 'soothing',
      instruments: ['rain_sounds', 'distant_piano', 'ambient'],
      bpmRange: [40, 60],
      key: ['Dm', 'Am'],
      energy: 'very-low',
      description: 'Soothing rain sounds for nighttime',
    },
    snow: {
      mood: 'tranquil',
      instruments: ['minimal_ambient', 'soft_bells', 'silence'],
      bpmRange: [35, 55],
      key: ['F', 'Bb'],
      energy: 'very-low',
      description: 'Tranquil snowy night silence',
    },
    other: {
      mood: 'quiet',
      instruments: ['ambient', 'minimal'],
      bpmRange: [45, 65],
      key: ['Am', 'Dm'],
      energy: 'very-low',
      description: 'Quiet nighttime ambient music',
    },
  },
};

/**
 * 時刻から時間帯を判定
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'late_morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * OpenWeatherMapの天気コードを標準化
 */
export function normalizeWeatherCondition(weatherCode: number): WeatherCondition {
  // OpenWeatherMap weather codes
  // https://openweathermap.org/weather-conditions
  if (weatherCode >= 200 && weatherCode < 300) return 'rain'; // Thunderstorm
  if (weatherCode >= 300 && weatherCode < 600) return 'rain'; // Drizzle, Rain
  if (weatherCode >= 600 && weatherCode < 700) return 'snow'; // Snow
  if (weatherCode >= 700 && weatherCode < 800) return 'other'; // Atmosphere (fog, mist, etc.)
  if (weatherCode === 800) return 'clear'; // Clear
  if (weatherCode > 800 && weatherCode < 900) return 'clouds'; // Clouds
  return 'other';
}

/**
 * 環境から音楽パラメータを取得
 */
export function getMusicParameters(
  timeOfDay: TimeOfDay,
  weatherCondition: WeatherCondition
): MusicParameters {
  return environmentMoodMap[timeOfDay][weatherCondition];
}

/**
 * 音楽パラメータからプロンプトを生成
 */
export function generateMusicPrompt(params: MusicParameters): string {
  const { mood, instruments, bpmRange, key, energy, description } = params;

  return `Create ${mood} background music for productivity and focus. ${description}. 
Instruments: ${instruments.join(', ')}. 
Tempo: ${bpmRange[0]}-${bpmRange[1]} BPM. 
Key: ${key.join(' or ')}. 
Energy level: ${energy}. 
Style: Instrumental, ambient, seamless loop, no lyrics, suitable for work and concentration.`;
}
