import type { NextConfig } from "next";

// `standalone` is only for the Docker self-hosted image. On Vercel the platform
// builds its own output, so the option must stay unset there.
const isVercel = Boolean(process.env.VERCEL);

const config: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" as const }),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default config;
