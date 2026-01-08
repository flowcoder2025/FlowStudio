import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net', // Kakao OAuth
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net', // Kakao OAuth (https)
      },
      {
        protocol: 'http',
        hostname: 't1.kakaocdn.net', // Kakao OAuth (thumbnail)
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net', // Kakao OAuth (thumbnail, https)
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

export default withNextIntl(nextConfig);
