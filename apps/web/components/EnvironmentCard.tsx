'use client';

import { useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, CloudDrizzle } from 'lucide-react';
import { useEnvironmentStore } from '@/store/environmentStore';

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudDrizzle,
};

const weatherLabels = {
  sunny: '晴れ',
  cloudy: '曇り',
  rainy: '雨',
  snowy: '雪',
  stormy: '嵐',
};

const timeOfDayLabels = {
  morning: '朝',
  afternoon: '午後',
  evening: '夕方',
  night: '夜',
  lateNight: '深夜',
};

const timeOfDayEmoji = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙',
  lateNight: '⭐',
};

export function EnvironmentCard() {
  const { currentEnvironment, isLoading, error, fetchCurrentEnvironment } = useEnvironmentStore();

  useEffect(() => {
    fetchCurrentEnvironment();
    // 15分ごとに更新
    const interval = setInterval(fetchCurrentEnvironment, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCurrentEnvironment]);

  if (isLoading && !currentEnvironment) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-48 bg-white/50 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={fetchCurrentEnvironment}
          className="text-sm text-red-700 underline hover:text-red-800"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!currentEnvironment) {
    return null;
  }

  const { timeOfDay, weather, season } = currentEnvironment;
  const WeatherIcon = weatherIcons[weather.condition] || Cloud;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{timeOfDayEmoji[timeOfDay]}</span>
            <h2 className="text-2xl font-bold text-gray-800">
              {timeOfDayLabels[timeOfDay]}
            </h2>
          </div>
          <p className="text-sm text-gray-600">{weather.location}</p>
        </div>
        <WeatherIcon className="w-12 h-12 text-blue-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-3xl font-bold text-gray-800">
            {weather.temperature}°C
          </p>
          <p className="text-sm text-gray-600">{weatherLabels[weather.condition]}</p>
        </div>

        <div className="bg-white/70 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-gray-700">湿度: {weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">季節: {season === 'spring' ? '春' : season === 'summer' ? '夏' : season === 'autumn' ? '秋' : '冬'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        最終更新: {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
