import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'WorkTunes AI',
    template: '%s | WorkTunes AI',
  },
  description: '環境適応型作業用BGM生成プラットフォーム',
  keywords: [
    'BGM',
    '作業用音楽',
    'AI音楽生成',
    '天気連動',
    '時間帯',
    '集中音楽',
    '生産性',
    'アンビエント',
  ],
  authors: [{ name: 'WorkTunes AI Team' }],
  creator: 'WorkTunes AI',
  publisher: 'WorkTunes AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://worktunes.ai',
    siteName: 'WorkTunes AI',
    title: 'WorkTunes AI - 環境適応型作業用BGM生成',
    description: 'リアルタイムの時間帯と天気情報に基づいて最適な作業用BGMを自動生成',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WorkTunes AI - 環境適応型作業用BGM生成',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WorkTunes AI',
    description: '環境適応型作業用BGM生成プラットフォーム',
    images: ['/twitter-image.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}