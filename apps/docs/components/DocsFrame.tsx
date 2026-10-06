"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/** Header + sidebar + main. The home page is full width with no sidebar. */
export function DocsFrame({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const fullWidth = pathname === "/";

  return (
    <>
      <Header menuOpen={menuOpen} onMenuToggle={() => { setMenuOpen((o) => !o); }} />
      <div className="seal-body" data-full={fullWidth ? "true" : "false"}>
        {(!fullWidth || menuOpen) && <Sidebar open={menuOpen} onNavigate={() => { setMenuOpen(false); }} />}
        {menuOpen && <div className="seal-scrim" aria-hidden="true" onClick={() => { setMenuOpen(false); }} />}
        <main id="seal-main" className={fullWidth ? "seal-main seal-main--full" : "seal-main atmo-page-glow"}>
          {children}
        </main>
      </div>
    </>
  );
}
