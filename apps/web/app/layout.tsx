import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VhyxSeal — seal the contract between your UI and the agentic web',
  description:
    'Machine-readable, signed contracts that tell AI agents what your UI does, how risky it is, and when a human must confirm.',
  metadataBase: new URL('https://vhyxseal.com'),
  openGraph: { title: 'VhyxSeal', description: 'Seal the contract between your UI and the agentic web.', url: 'https://vhyxseal.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
