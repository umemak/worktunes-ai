'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { bgmApi } from '@/lib/api';
import { useMusicStore } from '@/store/musicStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useAuthStore } from '@/store/authStore';

export function GenerationControls() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setTrack, addToHistory } = useMusicStore();
  const { weather, timeOfDay } = useEnvironmentStore();
  const { isAuthenticated } = useAuthStore();

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      setError('ログインが必要です');
      return;
    }

    if (!weather || !timeOfDay) {
      setError('環境データを読み込み中です。少々お待ちください。');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await bgmApi.generate({
        timeOfDay: timeOfDay.current,
        weatherCondition: weather.condition,
        durationSeconds: 180,
      });

      const bgmData = response.data;
      setTrack(bgmData);
      addToHistory(bgmData);
      
      // 自動再生
      setTimeout(() => {
        useMusicStore.getState().play();
      }, 500);

    } catch (err: any) {
      console.error('BGM generation error:', err);
      setError(
        err.response?.data?.message || 'BGMの生成に失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        環境適応型BGM生成
      </h2>

      <div className="space-y-4">
        {/* Current environment display */}
        {weather && timeOfDay && (
          <div className="bg-white/70 rounded-lg p-4 space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">現在の環境:</span>
              <span className="ml-2 font-medium text-gray-800">
                {timeOfDay.current} × {weather.condition}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">場所:</span>
              <span className="ml-2 font-medium text-gray-800">
                {weather.location}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">気温:</span>
              <span className="ml-2 font-medium text-gray-800">
                {weather.temperature}°C
              </span>
            </div>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !isAuthenticated}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              BGMを生成
            </>
          )}
        </Button>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Info */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              BGMを生成するにはログインが必要です
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>現在の時間帯と天気に基づいて、最適な作業用BGMを自動生成します。</p>
          <p className="mt-1">生成には約30秒かかります。</p>
        </div>
      </div>
    </div>
  );
}
