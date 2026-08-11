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
  // Prevent ESLint errors from failing production builds on Cloudflare Pages CI
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
