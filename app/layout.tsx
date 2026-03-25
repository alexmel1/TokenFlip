// app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Убери, если Inter не используется
import './globals.css';
import { Providers } from './providers'; // Это твой Providers компонент

// const inter = Inter({ subsets: ['latin'] }); // Убери, если Inter не используется

export const metadata: Metadata = {
  title: 'TokenFlip', // Или как ты назвал свой проект
  // description: 'A simple coin-flipping game on Base', // Можешь добавить описание
  other: {
    'base:app:id': '0xac0107e0e84b70e0a0a5d2eb3d0f0eb9',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Мета-тег верификации Talent Protocol */}
      <head>
        <meta name="talentapp:project_verification" content="8e68c0e710831f2d87a50614438d623bad71d1bbc3cce77ecbeab11b7a893415e9b2b3335f2718ccfc743a6bba9ecd42f8dc4cebc33017e8178a2d0d8d0ef496" />
        {/* Если ты используешь Google Fonts, то тег <link> для Inter мог бы быть здесь */}
      </head>
      {/* У тебя уже есть стили в <body>, которые нужно сохранить */}
      <body style={{ display: 'flex', flexDirection: 'column', background: '#020617' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
