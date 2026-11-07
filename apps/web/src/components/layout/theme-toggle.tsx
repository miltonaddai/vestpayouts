"use client";

import { useEffect, useState } from "react";
import { applyTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return (
    <button
      type="button"
      className={cn(
        "shrink-0 border-l border-line px-4 py-3 text-left font-mono text-[11px] tracking-[0.04em] text-sub uppercase hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal lg:px-5 lg:py-4 lg:text-[12px]",
        className,
      )}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        applyTheme(next ? "dark" : "light");
        setDark(next);
      }}
    >
      <span className="hidden lg:inline">[ THEME ] </span>
      <span className="dark:hidden">Dark</span>
      <span className="hidden dark:inline">Light</span>
    </button>
  );
}
