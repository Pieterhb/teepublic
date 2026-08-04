import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages (@cloudflare/next-on-pages)
  // Generates a standalone build compatible with the edge runtime
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.teepublic.com',
      }
    ],
  },
};

export default nextConfig;
