import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Shell } from './Shell';
import './globals.css';
import '../styles/seal.css';
import '../styles/lab.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'VhyxSeal Playground — Interactive contract examples',
  description: 'Interactive playground for VhyxSeal: adoption levels, animated contract maps, and a manifest signing lab.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
