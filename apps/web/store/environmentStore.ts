import { create } from 'zustand';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'other';
  conditionCode: number;
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

export interface TimeOfDayData {
  current: 'morning' | 'late_morning' | 'afternoon' | 'evening' | 'night';
  hour: number;
}

interface EnvironmentState {
  weather: WeatherData | null;
  timeOfDay: TimeOfDayData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  setWeather: (weather: WeatherData) => void;
  setTimeOfDay: (timeOfDay: TimeOfDayData) => void;
  setEnvironment: (weather: WeatherData, timeOfDay: TimeOfDayData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearEnvironment: () => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  weather: null,
  timeOfDay: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  setWeather: (weather) =>
    set({
      weather,
      lastUpdated: new Date(),
      error: null,
    }),

  setTimeOfDay: (timeOfDay) =>
    set({
      timeOfDay,
      lastUpdated: new Date(),
      error: null,
    }),

  setEnvironment: (weather, timeOfDay) =>
    set({
      weather,
      timeOfDay,
      lastUpdated: new Date(),
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearEnvironment: () =>
    set({
      weather: null,
      timeOfDay: null,
      error: null,
      lastUpdated: null,
    }),
}));
