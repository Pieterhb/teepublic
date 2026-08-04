import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — generates pure HTML/CSS/JS in the `out/` directory
  // Compatible with Cloudflare Pages without any adapter
  output: "export",
  images: {
    // Required for static export (no image optimization server)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.teepublic.com',
      }
    ],
  },
};

export default nextConfig;
