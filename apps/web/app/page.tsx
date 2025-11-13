import { Metadata } from 'next';
import MainInterface from '@/components/MainInterface';

export const metadata: Metadata = {
  title: 'WorkTunes AI - 環境適応型作業用BGM',
  description: 'リアルタイムの時間帯と天気情報に基づいて最適な作業用BGMを自動生成',
  keywords: ['BGM', '作業用音楽', 'AI', '天気', '時間帯', '集中', '生産性'],
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <MainInterface />
    </main>
  );
}