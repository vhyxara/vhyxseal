"use client";

import { useEffect, useRef, useState } from "react";

interface Heading {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

export function OnThisPage(): React.ReactElement {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("main h2[id], main h3[id]")
    );
    const found: Heading[] = els.map((el) => ({
      id: el.id,
      text: el.textContent ?? "",
      level: el.tagName === "H2" ? 2 : 3,
    }));
    setHeadings(found);

    if (found.length === 0) return;
    setActiveId(found[0]?.id ?? "");

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    for (const el of els) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  if (headings.length === 0) return <></>;

  return (
    <nav
      className="docs-on-this-page"
      aria-label="On this page"
      style={{
        position: "fixed",
        top: "calc(var(--docs-header-height) + 32px)",
        right: "32px",
        width: "196px",
        fontSize: "13px",
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--docs-text-muted)",
          marginBottom: "12px",
        }}
      >
        On this page
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              style={{
                display: "block",
                padding: "3px 0",
                paddingLeft: h.level === 3 ? "12px" : "0",
                color:
                  activeId === h.id
                    ? "var(--docs-text)"
                    : "var(--docs-text-muted)",
                textDecoration: "none",
                fontSize: h.level === 3 ? "12px" : "13px",
                fontWeight: activeId === h.id ? 600 : 400,
                borderLeft:
                  h.level === 3
                    ? `1px solid ${activeId === h.id ? "var(--docs-text)" : "var(--docs-border)"}`
                    : "none",
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
