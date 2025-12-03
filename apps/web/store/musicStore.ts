import { create } from 'zustand';

interface BGMResponse {
  id: string;
  audioUrl: string;
  prompt: string;
  timeOfDay: string;
  weatherCondition: string;
  musicParameters: {
    mood: string;
    instruments: string[];
    bpm: number;
    key: string[];
    energy: string;
  };
  metadata: {
    title: string;
    duration: number;
    genre: string;
    bpm: number;
    key: string;
    mood: string;
  };
  generatedAt: Date;
}

interface BGMRequest {
  environment: any;
  workType: 'focus' | 'creative' | 'relaxed' | 'energetic';
  duration: number;
  genre?: string[];
  mood?: string;
}

interface MusicState {
  currentTrack: BGMResponse | null;
  isPlaying: boolean;
  isGenerating: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  
  recentTracks: BGMResponse[];
  playlist: BGMResponse[];
  
  error: string | null;
  
  setCurrentTrack: (track: BGMResponse) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  skip: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  
  generateBGM: (request: BGMRequest) => Promise<void>;
  
  addToRecent: (track: BGMResponse) => void;
  clearRecent: () => void;
  
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  isGenerating: false,
  volume: 0.7,
  duration: 0,
  currentTime: 0,
  
  recentTracks: [],
  playlist: [],
  
  error: null,
  
  setCurrentTrack: (track) => {
    set({ 
      currentTrack: track,
      duration: track.metadata.duration,
      currentTime: 0
    });
    get().addToRecent(track);
  },
  
  play: () => {
    if (get().currentTrack) {
      set({ isPlaying: true });
    }
  },
  
  pause: () => {
    set({ isPlaying: false });
  },
  
  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
  },
  
  skip: () => {
    const { recentTracks, currentTrack } = get();
    if (recentTracks.length > 0) {
      const currentIndex = recentTracks.findIndex(t => t.id === currentTrack?.id);
      const nextTrack = recentTracks[currentIndex + 1] || recentTracks[0];
      set({ currentTrack: nextTrack, isPlaying: true, currentTime: 0 });
    }
  },
  
  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },
  
  seek: (time) => {
    set({ currentTime: Math.max(0, Math.min(time, get().duration)) });
  },
  
  generateBGM: async (request) => {
    try {
      set({ isGenerating: true, error: null });
      
      // モックデータ生成
      const mockTrack: BGMResponse = {
        id: `track_${Date.now()}`,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        prompt: `${request.workType}作業用の環境適応型BGM`,
        timeOfDay: request.environment?.timeOfDay || '午後',
        weatherCondition: request.environment?.weather?.condition || '晴れ',
        musicParameters: {
          mood: request.mood || 'calm',
          instruments: ['Piano', 'Strings', 'Ambient Pads'],
          bpm: 90,
          key: ['C major'],
          energy: 'medium'
        },
        metadata: {
          title: `${request.workType} BGM`,
          duration: request.duration,
          genre: request.genre?.[0] || 'Ambient',
          bpm: 90,
          key: 'C major',
          mood: request.mood || 'calm'
        },
        generatedAt: new Date()
      };
      
      set({ 
        currentTrack: mockTrack,
        duration: mockTrack.metadata.duration,
        currentTime: 0,
        isGenerating: false,
        isPlaying: false
      });
      
      get().addToRecent(mockTrack);
      
    } catch (error) {
      console.error('BGM generation error:', error);
      set({ 
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      });
    }
  },
  
  addToRecent: (track) => {
    const recent = get().recentTracks;
    if (!recent.find(t => t.id === track.id)) {
      set({ recentTracks: [track, ...recent].slice(0, 10) });
    }
  },
  
  clearRecent: () => {
    set({ recentTracks: [] });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  clearError: () => {
    set({ error: null });
  }
}));

export const useCurrentTrack = () => 
  useMusicStore(state => state.currentTrack);

export const useIsPlaying = () => 
  useMusicStore(state => state.isPlaying);

export const useIsGenerating = () => 
  useMusicStore(state => state.isGenerating);

export default useMusicStore;
