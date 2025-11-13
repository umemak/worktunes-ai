'use client';

import { EnvironmentCard } from './EnvironmentCard';
import { MusicPlayer } from './MusicPlayer';
import { GenerationControls } from './GenerationControls';
import { Header } from './Header';

export function MainInterface() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero section */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              環境適応型作業用BGM
            </h2>
            <p className="text-lg text-gray-600">
              時間帯と天気に応じて、AIが最適な作業用BGMを自動生成
            </p>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Environment */}
            <div className="lg:col-span-1 space-y-6">
              <EnvironmentCard />
            </div>

            {/* Middle column - Controls and Player */}
            <div className="lg:col-span-2 space-y-6">
              <GenerationControls />
              <MusicPlayer />
            </div>
          </div>

          {/* Features section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                AI音楽生成
              </h3>
              <p className="text-sm text-gray-600">
                ElevenLabs Music APIによる高品質なBGM生成
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌤️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                環境連動
              </h3>
              <p className="text-sm text-gray-600">
                リアルタイムの天気と時間帯に最適化
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                作業効率化
              </h3>
              <p className="text-sm text-gray-600">
                集中力を高める最適なサウンドスケープ
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2024 WorkTunes AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
