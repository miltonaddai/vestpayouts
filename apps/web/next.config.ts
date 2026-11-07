import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@vestpayouts/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: { formats: ["image/avif", "image/webp"] },
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
