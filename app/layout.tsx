import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TokenFlip",
  description: "1v1 Token Duel on Base",
  other: {
    // ТВОЙ НОВЫЙ ID ИЗ СКРИНШОТА
    'base:app_id': '69c0b79476e804b2a67a9f96',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
