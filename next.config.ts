import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * Next.js Configuration
 * Contract: PERF_FUNC_BUNDLE_SPLIT
 *
 * 최적화 기능:
 * - 코드 스플리팅 최적화
 * - 청크 분리 설정
 * - 번들 크기 최적화
 * - i18n 다국어 지원
 */

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // 번들 최적화
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
      '@lemonsqueezy/lemonsqueezy.js',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
      },
    ],
    // 이미지 최적화 설정
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // 번들 분석을 위한 설정 (ANALYZE=true npm run build)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../analyze/client.html',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),

  // 청크 분리 최적화
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            // 프레임워크 청크 (React, Next.js)
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
              priority: 40,
              chunks: 'all',
              enforce: true,
            },
            // UI 라이브러리 청크 (Radix, Lucide)
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              priority: 30,
              chunks: 'all',
            },
            // 이미지 처리 청크
            imageProcessing: {
              name: 'image-processing',
              test: /[\\/]node_modules[\\/](@imgly|@xenova)[\\/]/,
              priority: 25,
              chunks: 'async',
            },
            // 결제 관련 청크
            payment: {
              name: 'payment',
              test: /[\\/]node_modules[\\/](@lemonsqueezy)[\\/]/,
              priority: 20,
              chunks: 'async',
            },
            // 공통 라이브러리
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10,
              chunks: 'async',
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // 헤더 최적화
  async headers() {
    return [
      {
        // 정적 자산 캐싱
        source: '/:path*.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // JS/CSS 번들 캐싱
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API 응답 캐싱 (짧은 시간)
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // 압축 활성화
  compress: true,

  // 프로덕션 소스맵 비활성화 (빌드 크기 최적화)
  productionBrowserSourceMaps: false,

  // Powered by 헤더 제거
  poweredByHeader: false,
};

// 번들 스플릿 설정 내보내기 (Evidence용)
export const bundleSplitConfig = {
  splitChunks: {
    framework: 'react, react-dom, next, scheduler',
    ui: '@radix-ui, lucide-react, class-variance-authority',
    imageProcessing: '@imgly, @xenova (async)',
    payment: '@lemonsqueezy (async)',
    commons: 'shared modules (minChunks: 2)',
  },
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'date-fns',
    'lodash',
  ],
  caching: {
    static: '1 year (immutable)',
    api: 'no-store',
  },
};

export default withNextIntl(nextConfig);
