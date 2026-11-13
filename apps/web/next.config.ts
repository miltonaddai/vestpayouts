import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local docs and this machine use http://127.0.0.1:4317. Next 16 treats that
  // as a different origin from localhost and blocks /_next/hmr, which makes the
  // dev client fall back to repeating full-page reloads.
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  transpilePackages: ["@vestpayouts/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return [{ source: "/home", destination: "/", permanent: true }];
  },
  // Tailwind v4 is applied to CSS through this loader. Classic ISR (`revalidate`) stays on;
  // cacheComponents is intentionally off so route segment config keeps working.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
