import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  devIndicators: false,
  headers() {
    // Campaign films and posters are re-requested when a screen goes back to sleep and wakes up again.
    // Letting the browser keep them for a week turns those repeats into cache hits instead of downloads.
    return [
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
