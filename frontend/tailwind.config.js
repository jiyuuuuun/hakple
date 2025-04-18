/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 기본 색상 확장
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // 메인 보라색 (버튼)
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        gray: {
          50: '#f9fafb', // 배경색
          100: '#f3f4f6', // 태그 배경
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af', // 아이콘 색상
          500: '#6b7280', // 부가 텍스트
          600: '#4b5563',
          700: '#374151', // 기본 텍스트
          800: '#1f2937', // 제목 텍스트
          900: '#111827',
          950: '#030712',
        },
        custom: {
          purple: {
            DEFAULT: '#980ffa',
            hover: '#8a45bc'
          }
        }
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],     // 작은 텍스트 (시간, 태그)
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 기본 내용 텍스트
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 기본 텍스트
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 게시물 제목
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 섹션 제목
      },
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '2': '0.5rem',      // 8px
        '3': '0.75rem',     // 12px
        '4': '1rem',        // 16px
        '6': '1.5rem',      // 24px
        '8': '2rem',        // 32px
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',     // 2px
        'DEFAULT': '0.25rem',  // 4px
        'md': '0.375rem',     // 6px
        'lg': '0.5rem',       // 8px
        'full': '9999px',     // 원형
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      keyframes: {
        'pulse-light': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        'highlight-fade': {
          '0%': { backgroundColor: 'rgb(243 232 255)' },  // purple-100
          '100%': { backgroundColor: 'transparent' }
        }
      },
      animation: {
        'pulse-light': 'pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'highlight-fade': 'highlight-fade 3s ease-in-out 1'
      }
    },
  },
  plugins: [],
} 