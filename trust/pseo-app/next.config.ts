import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
