import type { Metadata } from 'next';
import { Shell } from './Shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'VhyxSeal Playground — Interactive contract examples',
  description: 'Interactive playground for VhyxSeal: adoption levels, animated contract maps, and a manifest signing lab.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
