"use client";

import { useSyncExternalStore } from "react";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

function subscribe() {
  return () => {};
}

/**
 * Blocking theme bootstrap for the first paint. next/script with
 * beforeInteractive only queues into __next_s and runs after the Next
 * runtime starts, which flashes the default dark class for light users.
 * React 19 warns if a <script> is created during a client render, so this
 * emits the tag on the server and the matching hydration pass only.
 */
export function ThemeScript() {
  const renderScript = useSyncExternalStore(subscribe, () => false, () => true);
  if (!renderScript) return null;
  return <script id="vestpayouts-theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
