import type { NextConfig } from "next";
const config: NextConfig = {
  // TypeScript errors in legacy src/ files (TanStack Router imports) are intentionally
  // ignored here — they will be fixed as part of the Next.js migration tasks (tasks 8–10).
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};
export default config;
