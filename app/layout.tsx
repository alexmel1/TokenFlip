import type { Metadata } from "next";
import { Providers } from "./providers";
import "@coinbase/onchainkit/styles.css";

export const metadata: Metadata = {
  title: "TokenFlip",
  other: {
    'base:app_id': '69c0b79476e804b2a67a9f82',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#020617' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
