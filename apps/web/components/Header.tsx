'use client';

import { useState } from 'react';
import { Music, LogIn, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { LoginDialog } from './auth/LoginDialog';

export function Header() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Music className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                WorkTunes AI
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{user?.username}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    ログアウト
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowLoginDialog(true)}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  ログイン
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />
    </>
  );
}
