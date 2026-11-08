"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readStoredTheme } from "@/lib/theme";
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

export function ThemeInit() {
  useEffect(() => {
    const stored = readStoredTheme();
    applyTheme(stored ?? "dark");
  }, []);
  return null;
}

// The theme lives on <html class="dark">. Subscribe to that class directly so
// every toggle on the page (header and mobile menu) stays in sync.
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");
const isDarkOnServer = () => true;

export function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribeToTheme, isDark, isDarkOnServer);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      className={cn(
        "flex shrink-0 items-center gap-2.5 border-l border-line px-4 py-3 text-sub uppercase hover:bg-paper hover:text-ink focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal lg:px-5 lg:py-4",
        className,
      )}
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        applyTheme(next ? "dark" : "light");
      }}
    >
      <span>Theme</span>
      <span
        aria-hidden="true"
        className="relative inline-flex h-6 w-11 items-center rounded-full border border-line bg-paper"
      >
        <span className="absolute top-[2px] left-[2px] flex size-[18px] items-center justify-center rounded-full bg-ink text-background transition-transform duration-200 ease-out motion-reduce:transition-none dark:translate-x-5">
          <SunIcon className="h-3 w-3 dark:hidden" />
          <MoonIcon className="hidden h-3 w-3 dark:block" />
        </span>
      </span>
    </button>
  );
}
