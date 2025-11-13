'use client';

import { useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useMusicStore } from '@/store/musicStore';
import { Button } from './ui/button';
import { formatTime } from '@/lib/utils';

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    duration,
    currentTime,
    play,
    pause,
    stop,
    setVolume,
    seek,
  } = useMusicStore();

  if (!currentTrack) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">BGMを生成してください</p>
      </div>
    );
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {currentTrack.musicParameters.mood}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {currentTrack.prompt}
        </p>
      </div>

      {/* Track info */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="bg-white/70 rounded-lg p-2">
          <span className="text-gray-600">時間帯:</span>
          <span className="ml-2 font-medium text-gray-800">
            {currentTrack.timeOfDay}
          </span>
        </div>
        <div className="bg-white/70 rounded-lg p-2">
          <span className="text-gray-600">天気:</span>
          <span className="ml-2 font-medium text-gray-800">
            {currentTrack.weatherCondition}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={stop}
          disabled={!isPlaying}
          className="text-gray-600"
        >
          <SkipForward className="w-5 h-5" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          {volume === 0 ? (
            <VolumeX className="w-5 h-5 text-gray-600" />
          ) : (
            <Volume2 className="w-5 h-5 text-gray-600" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </div>

      {/* Track details */}
      <div className="bg-white/70 rounded-lg p-3 text-xs text-gray-600 space-y-1">
        <div>
          <span className="font-medium">楽器:</span> {currentTrack.musicParameters.instruments.join(', ')}
        </div>
        <div>
          <span className="font-medium">BPM:</span> {currentTrack.musicParameters.bpm}
        </div>
        <div>
          <span className="font-medium">キー:</span> {currentTrack.musicParameters.key.join(', ')}
        </div>
        <div>
          <span className="font-medium">エネルギー:</span> {currentTrack.musicParameters.energy}
        </div>
      </div>
    </div>
  );
}
