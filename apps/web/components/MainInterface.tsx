'use client';

import { useState, useEffect } from 'react';
import { EnvironmentCard } from './EnvironmentCard';
import { MusicPlayer } from './MusicPlayer';
import { GenerationControls } from './GenerationControls';
import { RecentGenerations } from './RecentGenerations';
import { Header } from './Header';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { LoginDialog } from './auth/LoginDialog';

export default function MainInterface() {
  const { user } = useAuthStore();
  const { 
    currentEnvironment, 
    isLoading: environmentLoading, 
    fetchCurrentEnvironment 
  } = useEnvironmentStore();
  const { 
    currentTrack, 
    recentTracks, 
    isPlaying,
    isGenerating,
    play,
    pause,
    skip,
    generateBGM
  } = useMusicStore();

  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    // Fetch current environment on mount
    fetchCurrentEnvironment();
  }, [fetchCurrentEnvironment]);

  const handleGenerate = async (params: any) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    
    await generateBGM(params);
  };

  const handlePlay = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    play();
  };

  const handlePause = () => {
    pause();
  };

  const handleSkip = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    skip();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header onLoginClick={() => setShowLoginDialog(true)} />
      
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Environment Information */}
        <EnvironmentCard 
          environment={currentEnvironment}
          isLoading={environmentLoading}
        />

        {/* Music Player */}
        <MusicPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onSkip={handleSkip}
        />

        {/* Generation Controls */}
        <GenerationControls
          environment={currentEnvironment}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          disabled={!user}
        />

        {/* Recent Generations */}
        <RecentGenerations 
          tracks={recentTracks}
          onTrackSelect={(track) => {
            if (!user) {
              setShowLoginDialog(true);
              return;
            }
            // Handle track selection
          }}
        />
      </div>

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2025 WorkTunes AI. All rights reserved.</p>
          <p className="mt-1">
            Powered by AI music generation technology
          </p>
        </div>
      </footer>
    </div>
  );
}