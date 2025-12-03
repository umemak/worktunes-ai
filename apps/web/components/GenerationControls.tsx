'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useMusicStore } from '@/store/musicStore';
import { useEnvironmentStore } from '@/store/environmentStore';

const workTypes = [
  { value: 'focus', label: '集中', emoji: '🎯', color: 'bg-blue-100 text-blue-700' },
  { value: 'creative', label: '創作', emoji: '🎨', color: 'bg-purple-100 text-purple-700' },
  { value: 'relaxed', label: 'リラックス', emoji: '😌', color: 'bg-green-100 text-green-700' },
  { value: 'energetic', label: 'エネルギッシュ', emoji: '⚡', color: 'bg-orange-100 text-orange-700' },
] as const;

export function GenerationControls() {
  const [selectedWorkType, setSelectedWorkType] = useState<'focus' | 'creative' | 'relaxed' | 'energetic'>('focus');
  const { generateBGM, isGenerating, error } = useMusicStore();
  const { currentEnvironment, fetchCurrentEnvironment } = useEnvironmentStore();

  const handleGenerate = async () => {
    if (!currentEnvironment) {
      await fetchCurrentEnvironment();
    }

    await generateBGM({
      environment: currentEnvironment || undefined,
      workType: selectedWorkType,
      duration: 180,
      mood: 'calm'
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🎵 BGM生成
      </h2>

      <div className="space-y-4">
        {/* Work Type Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            作業タイプを選択
          </label>
          <div className="grid grid-cols-2 gap-2">
            {workTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedWorkType(type.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedWorkType === type.value
                    ? 'border-purple-500 ' + type.color
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{type.emoji}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current environment display */}
        {currentEnvironment && (
          <div className="bg-white/70 rounded-lg p-4 space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">現在の環境:</span>
              <span className="ml-2 font-medium text-gray-800">
                {currentEnvironment.timeOfDay} × {currentEnvironment.weather.condition}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">場所:</span>
              <span className="ml-2 font-medium text-gray-800">
                {currentEnvironment.weather.location}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">気温:</span>
              <span className="ml-2 font-medium text-gray-800">
                {currentEnvironment.weather.temperature}°C
              </span>
            </div>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
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

        <div className="text-xs text-gray-500">
          <p>現在の時間帯と天気に基づいて、最適な作業用BGMを自動生成します。</p>
          <p className="mt-1">（デモ版：モックデータを表示します）</p>
        </div>
      </div>
    </div>
  );
}
