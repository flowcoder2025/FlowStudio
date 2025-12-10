import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Docker/Cloud Run 배포를 위한 standalone 모드
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    // Explicit alias for next-auth to fix Turbopack module resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/auth': 'next-auth',
      'next/auth/react': 'next-auth/react',
      'next/auth/providers/google': 'next-auth/providers/google',
    };
    return config;
  },
};

export default nextConfig;
