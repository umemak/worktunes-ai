import { create } from 'zustand';
import { Howl } from 'howler';

export interface BGMTrack {
  id: string;
  audioUrl: string;
  prompt: string;
  timeOfDay: string;
  weatherCondition: string;
  musicParameters: {
    mood: string;
    instruments: string[];
    bpm: string;
    key: string[];
    energy: string;
  };
  generatedAt: Date;
}

interface MusicState {
  // Current playback state
  currentTrack: BGMTrack | null;
  isPlaying: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  
  // Howler instance
  howl: Howl | null;
  
  // History
  history: BGMTrack[];
  
  // Actions
  setTrack: (track: BGMTrack) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  addToHistory: (track: BGMTrack) => void;
  clearHistory: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  duration: 0,
  currentTime: 0,
  howl: null,
  history: [],

  setTrack: (track) => {
    const { howl } = get();
    
    // Stop and unload previous track
    if (howl) {
      howl.stop();
      howl.unload();
    }

    // Create new Howl instance
    const newHowl = new Howl({
      src: [track.audioUrl],
      html5: true,
      volume: get().volume,
      onload: function() {
        set({ duration: newHowl.duration() });
      },
      onplay: function() {
        set({ isPlaying: true });
        // Update current time
        const updateTime = () => {
          if (get().isPlaying) {
            set({ currentTime: newHowl.seek() as number });
            requestAnimationFrame(updateTime);
          }
        };
        requestAnimationFrame(updateTime);
      },
      onpause: function() {
        set({ isPlaying: false });
      },
      onstop: function() {
        set({ isPlaying: false, currentTime: 0 });
      },
      onend: function() {
        set({ isPlaying: false, currentTime: 0 });
      },
      onerror: function(id, error) {
        console.error('Howler error:', error);
        set({ isPlaying: false });
      },
    });

    set({
      currentTrack: track,
      howl: newHowl,
      isPlaying: false,
      currentTime: 0,
    });
  },

  play: () => {
    const { howl } = get();
    if (howl) {
      howl.play();
    }
  },

  pause: () => {
    const { howl } = get();
    if (howl) {
      howl.pause();
    }
  },

  stop: () => {
    const { howl } = get();
    if (howl) {
      howl.stop();
    }
  },

  setVolume: (volume) => {
    const { howl } = get();
    if (howl) {
      howl.volume(volume);
    }
    set({ volume });
  },

  seek: (time) => {
    const { howl } = get();
    if (howl) {
      howl.seek(time);
      set({ currentTime: time });
    }
  },

  setCurrentTime: (currentTime) => set({ currentTime }),
  
  setDuration: (duration) => set({ duration }),

  addToHistory: (track) => {
    set((state) => ({
      history: [track, ...state.history.filter(t => t.id !== track.id)].slice(0, 20),
    }));
  },

  clearHistory: () => set({ history: [] }),
}));
