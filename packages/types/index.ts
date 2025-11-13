import { z } from 'zod';

// Environment Data Types
export const EnvironmentDataSchema = z.object({
  timestamp: z.date(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night', 'lateNight']),
  weather: z.object({
    condition: z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'stormy']),
    temperature: z.number(),
    humidity: z.number(),
    location: z.string(),
  }),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
});

export type EnvironmentData = z.infer<typeof EnvironmentDataSchema>;

// BGM Request/Response Types
export const BGMRequestSchema = z.object({
  environment: EnvironmentDataSchema,
  workType: z.enum(['focus', 'creative', 'relaxed', 'energetic']),
  duration: z.number().min(30).max(600), // 30 seconds to 10 minutes
  genre: z.array(z.string()).optional(),
  instruments: z.array(z.string()).optional(),
  bpm: z.number().min(60).max(180).optional(),
  mood: z.enum(['calm', 'upbeat', 'meditative', 'inspiring']).optional(),
});

export type BGMRequest = z.infer<typeof BGMRequestSchema>;

export const BGMMetadataSchema = z.object({
  title: z.string(),
  duration: z.number(),
  genre: z.string(),
  bpm: z.number(),
  key: z.string(),
  mood: z.string(),
});

export type BGMMetadata = z.infer<typeof BGMMetadataSchema>;

export const BGMResponseSchema = z.object({
  id: z.string().uuid(),
  audioUrl: z.string().url(),
  metadata: BGMMetadataSchema,
  generatedAt: z.date(),
  environment: EnvironmentDataSchema,
});

export type BGMResponse = z.infer<typeof BGMResponseSchema>;

// User Profile Types
export const MusicPreferencesSchema = z.object({
  tempoRange: z.tuple([z.number(), z.number()]), // [min, max] BPM
  excludeInstruments: z.array(z.string()),
  preferredMoods: z.array(z.string()),
});

export const WorkScheduleEntrySchema = z.object({
  workStart: z.string().regex(/^\d{2}:\d{2}$/), // "09:00" format
  workEnd: z.string().regex(/^\d{2}:\d{2}$/),   // "18:00" format
  breakTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)), // ["12:00", "15:00"]
});

export const UserPreferencesSchema = z.object({
  favoriteGenres: z.array(z.string()),
  workSchedule: z.record(z.string(), WorkScheduleEntrySchema), // day of week -> schedule
  musicPreferences: MusicPreferencesSchema,
});

export const UserUsageSchema = z.object({
  totalListeningTime: z.number().min(0),
  favoriteGenerations: z.array(z.string().uuid()),
  skipHistory: z.array(z.string().uuid()),
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  preferences: UserPreferencesSchema,
  usage: UserUsageSchema,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Authentication Types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  timezone: z.string().default('UTC'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
  timezone: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: z.object({
    access: z.string(),
    refresh: z.string(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Playlist Types
export const PlaylistSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Playlist = z.infer<typeof PlaylistSchema>;

export const PlaylistTrackSchema = z.object({
  id: z.string().uuid(),
  playlistId: z.string().uuid(),
  bgmId: z.string().uuid(),
  position: z.number().min(0),
  addedAt: z.date(),
});

export type PlaylistTrack = z.infer<typeof PlaylistTrackSchema>;

// API Response Types
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.date(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional(),
});

export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;

// Weather API Types
export const WeatherDataSchema = z.object({
  condition: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  description: z.string(),
  icon: z.string(),
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;

// Activity Tracking Types
export const UserActivitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bgmId: z.string().uuid(),
  activityType: z.enum(['play', 'skip', 'like', 'download']),
  durationPlayed: z.number().min(0).optional(),
  createdAt: z.date(),
});

export type UserActivity = z.infer<typeof UserActivitySchema>;

// Environment Mood Mapping Types
export interface EnvironmentMoodConfig {
  mood: string;
  instruments: string[];
  bpmRange: [number, number];
  key: string[];
  energy: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high';
}

export interface WorkTypeAdjustment {
  tempoMultiplier: number;
  complexityReduction?: number;
  complexityIncrease?: number;
  preferredInstruments: string[];
  avoidInstruments?: string[];
  inspirationalElements?: boolean;
  meditativeElements?: boolean;
}

// Export all schemas for validation
export const schemas = {
  EnvironmentData: EnvironmentDataSchema,
  BGMRequest: BGMRequestSchema,
  BGMResponse: BGMResponseSchema,
  UserProfile: UserProfileSchema,
  User: UserSchema,
  LoginRequest: LoginRequestSchema,
  RegisterRequest: RegisterRequestSchema,
  AuthResponse: AuthResponseSchema,
  Playlist: PlaylistSchema,
  PlaylistTrack: PlaylistTrackSchema,
  ApiError: ApiErrorSchema,
  ApiSuccess: ApiSuccessSchema,
  WeatherData: WeatherDataSchema,
  UserActivity: UserActivitySchema,
};