import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    turbopack: {
      root: '../../',
    },
  },
};

export default nextConfig;
