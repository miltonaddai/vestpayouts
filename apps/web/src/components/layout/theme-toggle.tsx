"use client";

import { useEffect, useState } from "react";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <circle cx="8" cy="8" r="2.4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
        <path d="M8 1.75v1.4M8 12.85v1.4M1.75 8h1.4M12.85 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </g>
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M9.15 2.05a.6.6 0 0 0-.7.72 5.1 5.1 0 0 1-4.68 6.08 5.1 5.1 0 0 1-2.2-.42.6.6 0 0 0-.72.86A6.35 6.35 0 1 0 9.8 2.12a.6.6 0 0 0-.65-.07Z"
      />
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      className={cn(
        "flex shrink-0 items-center justify-center border-l border-line px-3 hover:bg-paper focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal lg:px-5",
        className,
      )}
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        applyTheme(next ? "dark" : "light");
        setDark(next);
      }}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex h-6 w-11 items-center rounded-full border border-line bg-paper"
      >
        <span className="absolute top-[2px] left-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-ink text-background transition-transform duration-200 ease-out motion-reduce:transition-none dark:translate-x-5">
          <SunIcon className="h-3 w-3 dark:hidden" />
          <MoonIcon className="hidden h-3 w-3 dark:block" />
        </span>
      </span>
    </button>
  );
}
