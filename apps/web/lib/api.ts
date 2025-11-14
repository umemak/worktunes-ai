import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Axiosインスタンスの作成
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター：認証トークンを自動付与
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター：トークンリフレッシュ処理
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // 401エラーでリフレッシュトークンがある場合
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

        if (!refreshToken) {
          clearAuth();
          return Promise.reject(error);
        }

        // トークンリフレッシュ
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

        // 新しいトークンを保存
        setAuth(user, newAccessToken, newRefreshToken);

        // リクエストを再試行
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // リフレッシュ失敗
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API型定義
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface BGMGenerationRequest {
  timeOfDay?: 'morning' | 'late_morning' | 'afternoon' | 'evening' | 'night';
  weatherCondition?: 'clear' | 'clouds' | 'rain' | 'snow' | 'other';
  customPrompt?: string;
  durationSeconds?: number;
}

// 認証API
export const authApi = {
  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// BGM API
export const bgmApi = {
  generate: async (request: BGMGenerationRequest) => {
    const response = await apiClient.post('/bgm/generate', request);
    return response.data;
  },

  getHistory: async (limit?: number) => {
    const response = await apiClient.get('/bgm/history', {
      params: { limit },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/bgm/${id}`);
    return response.data;
  },
};

// 環境データAPI
export const environmentApi = {
  getCurrent: async (params: { lat?: number; lon?: number; city?: string }) => {
    const response = await apiClient.get('/environment/current', { params });
    return response.data;
  },

  getWeather: async (params: { lat?: number; lon?: number; city?: string }) => {
    const response = await apiClient.get('/environment/weather', { params });
    return response.data;
  },

  getTimeOfDay: async () => {
    const response = await apiClient.get('/environment/time-of-day');
    return response.data;
  },
};

export default apiClient;
