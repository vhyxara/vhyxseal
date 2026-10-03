import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import { DocsFrame } from "../components/DocsFrame";
import { Search } from "../components/Search";

// CSS imports — @vhyxseal/style first so its custom properties are declared
// before globals.css aliases them via var(). Next.js respects import order.
import "@vhyxseal/style";
// VhyxUI (tokens only — no reset — plus component styles in @layer components) for dogfooded pages.
import "@vhyxui/tokens/tokens.css";
import "@vhyxui/react/style.css";
import "./globals.css";
import "../styles/seal.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "VhyxSeal — Semantic contract layer for the agentic web",
  description:
    "OpenAPI for your UI layer. Make your web application readable and safe for AI agents.",
};

/**
 * Root layout — wraps every docs page.
 *
 * ThemeProvider sets data-theme="light"|"dark" on <html> in response to
 * the user's selection. suppressHydrationWarning on <html> suppresses the
 * hydration mismatch caused by next-themes updating the attribute client-side
 * before React hydrates.
 *
 * Search is rendered here so it is available on every page. It manages its
 * own open state and responds to Cmd+K keyboard shortcuts and the custom
 * "vhyxseal:opensearch" event dispatched by the Header's search button.
 *
 * Layout: <Search /> modal, then DocsFrame (header, sidebar, main).
 * Dark is the default theme; light is one click away in the header.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en" data-theme="dark" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          <Search />
          <DocsFrame>{children}</DocsFrame>
        </ThemeProvider>
      </body>
    </html>
  );
}
