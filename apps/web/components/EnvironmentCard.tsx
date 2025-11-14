'use client';

import { useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets } from 'lucide-react';
import { useEnvironmentStore } from '@/store/environmentStore';
import { environmentApi } from '@/lib/api';

const weatherIcons = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  other: Wind,
};

const timeOfDayLabels = {
  morning: '朝',
  late_morning: '午前',
  afternoon: '午後',
  evening: '夕方',
  night: '夜',
};

export function EnvironmentCard() {
  const { weather, timeOfDay, isLoading, error, setEnvironment, setLoading, setError } = 
    useEnvironmentStore();

  useEffect(() => {
    loadEnvironmentData();
    // 5分ごとに更新
    const interval = setInterval(loadEnvironmentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadEnvironmentData = async () => {
    setLoading(true);
    try {
      // ブラウザのGeolocation APIで位置情報を取得
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await environmentApi.getCurrent({
              lat: latitude,
              lon: longitude,
            });
            setEnvironment(response.data.weather, response.data.timeOfDay);
          },
          async (error) => {
            // 位置情報取得失敗時はデフォルト都市（東京）を使用
            console.warn('Geolocation error:', error);
            const response = await environmentApi.getCurrent({ city: 'Tokyo' });
            setEnvironment(response.data.weather, response.data.timeOfDay);
          }
        );
      } else {
        // Geolocation非対応の場合はデフォルト都市を使用
        const response = await environmentApi.getCurrent({ city: 'Tokyo' });
        setEnvironment(response.data.weather, response.data.timeOfDay);
      }
    } catch (err) {
      setError('環境データの取得に失敗しました');
      console.error('Error loading environment:', err);
    }
  };

  if (isLoading && !weather) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-32 bg-white/50 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadEnvironmentData}
          className="mt-2 text-red-700 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!weather || !timeOfDay) {
    return null;
  }

  const WeatherIcon = weatherIcons[weather.condition];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {timeOfDayLabels[timeOfDay.current]}
          </h2>
          <p className="text-sm text-gray-600">{weather.location}</p>
        </div>
        <WeatherIcon className="w-12 h-12 text-blue-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-3xl font-bold text-gray-800">
            {weather.temperature}°C
          </p>
          <p className="text-sm text-gray-600 capitalize">{weather.description}</p>
        </div>

        <div className="bg-white/70 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-gray-700">湿度: {weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-blue-500" />
            <span className="text-gray-700">風速: {weather.windSpeed} m/s</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        最終更新: {new Date().toLocaleTimeString('ja-JP')}
      </div>
    </div>
  );
}
