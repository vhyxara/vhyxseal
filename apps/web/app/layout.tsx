import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '../styles/landing.css';
import '../styles/brand.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'VhyxSeal — seal the contract between your UI and the agentic web',
  description:
    'Machine-readable, signed contracts that tell AI agents what your UI does, how risky it is, and when a human must confirm.',
  metadataBase: new URL('https://vhyxseal.com'),
  alternates: { canonical: '/' },
  openGraph: { title: 'VhyxSeal', description: 'Seal the contract between your UI and the agentic web.', url: 'https://vhyxseal.com' },
};

// Applies a saved light theme before first paint (dark is the default).
// Also marks that scripts run, so scroll-reveal only hides content when it can reveal it again.
const THEME_SCRIPT = `document.documentElement.classList.add('js');try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
