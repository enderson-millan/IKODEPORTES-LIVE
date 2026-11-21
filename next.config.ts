import type { NextConfig } from "next";

const config: NextConfig = {
  // Produces .next/standalone so the Docker `web` stage stays small.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default config;
