"use client";

import { useEffect } from "react";

/** Must match the block selector in globals.css ("Entrance motion"). */
const TARGETS =
  ":is(main > * > :not([data-reveal-children]), main [data-reveal-children] > :not([data-reveal-children]))" +
  ':not([class*="animate-"], [data-no-reveal], script, style)';

/**
 * Scroll-triggered entrances. Page-load motion is pure CSS; this only holds back
 * blocks that are still below the fold after hydration (adding .reveal-wait) and
 * releases each one as it scrolls into view, which replays the CSS animation.
 * New blocks from client-side navigation are picked up by a MutationObserver.
 * If this never runs, nothing is hidden.
 */
export function ScrollReveal() {
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove("reveal-wait");
          io.unobserve(entry.target);
        }
      },
      // Start a little before the block's top edge reaches the viewport bottom.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    const scan = () => {
      const fold = window.innerHeight;
      main.querySelectorAll(TARGETS).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        // Already on screen (or above it): leave it to the CSS load animation.
        if (el.getBoundingClientRect().top < fold * 0.92) return;
        el.classList.add("reveal-wait");
        io.observe(el);
      });
    };

    scan();
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    });
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      main.querySelectorAll(".reveal-wait").forEach((el) => el.classList.remove("reveal-wait"));
    };
  }, []);

  return null;
}
