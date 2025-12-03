import { create } from 'zustand';

interface EnvironmentData {
  timestamp: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'lateNight';
  weather: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
    temperature: number;
    humidity: number;
    location: string;
  };
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

interface EnvironmentState {
  currentEnvironment: EnvironmentData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  userLocation: {
    lat: number;
    lon: number;
    city?: string;
  } | null;
  
  fetchCurrentEnvironment: () => Promise<void>;
  setUserLocation: (lat: number, lon: number) => void;
  refreshEnvironment: () => Promise<void>;
  setError: (error: string | null) => void;
  generateFallbackEnvironment: () => EnvironmentData;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  currentEnvironment: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  userLocation: null,

  fetchCurrentEnvironment: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const fallbackEnvironment = get().generateFallbackEnvironment();
      
      set({ 
        currentEnvironment: fallbackEnvironment,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
      
    } catch (error) {
      console.error('Environment fetch error:', error);
      
      const fallbackEnvironment = get().generateFallbackEnvironment();
      
      set({ 
        currentEnvironment: fallbackEnvironment,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: new Date()
      });
    }
  },

  setUserLocation: (lat: number, lon: number) => {
    set({ userLocation: { lat, lon } });
    get().fetchCurrentEnvironment();
  },

  refreshEnvironment: async () => {
    await get().fetchCurrentEnvironment();
  },

  setError: (error: string | null) => {
    set({ error });
  },

  generateFallbackEnvironment: (): EnvironmentData => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();
    
    let timeOfDay: EnvironmentData['timeOfDay'];
    if (hour >= 5 && hour < 9) timeOfDay = 'morning';
    else if (hour >= 9 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 && hour < 24) timeOfDay = 'night';
    else timeOfDay = 'lateNight';
    
    let season: EnvironmentData['season'];
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'autumn';
    else season = 'winter';
    
    return {
      timestamp: now,
      timeOfDay,
      weather: {
        condition: 'cloudy',
        temperature: 22,
        humidity: 60,
        location: 'Tokyo, JP'
      },
      season
    };
  }
}));

export const useCurrentEnvironment = () => 
  useEnvironmentStore(state => state.currentEnvironment);

export const useEnvironmentLoading = () => 
  useEnvironmentStore(state => state.isLoading);

export const useEnvironmentError = () => 
  useEnvironmentStore(state => state.error);

export default useEnvironmentStore;
