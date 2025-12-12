import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        // [성능 최적화] 이미지 로딩 shimmer 애니메이션
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
};

export default config;
