import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Search } from "../components/Search";

// CSS imports — @vhyxseal/style first so its custom properties are declared
// before globals.css aliases them via var(). Next.js respects import order.
import "@vhyxseal/style";
import "./globals.css";

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
 * Layout structure:
 *   <html data-theme="…">
 *     <body>
 *       ← ThemeProvider renders no DOM element —
 *       <Search />         ← modal, full-screen overlay when open
 *       <Header />         ← fixed, full-width, 56px tall
 *       <div>              ← flex row, padded top by header height
 *         <Sidebar />      ← fixed, 240px wide, full height below header
 *         <main>           ← scrolls, offset left by sidebar width
 *           {children}
 *         </main>
 *       </div>
 *     </body>
 *   </html>
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          <Search />
          <Header />
          <div
            style={{
              display: "flex",
              paddingTop: "var(--docs-header-height)",
              minHeight: "100vh",
            }}
          >
            <Sidebar />
            <main
              style={{
                flex: 1,
                marginLeft: "var(--docs-sidebar-width)",
                padding: "40px 48px",
                maxWidth: "860px",
                minWidth: 0,
              }}
            >
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
