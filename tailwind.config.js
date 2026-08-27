/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
        colors: {
          // Ověřeno vzorkováním reálného loga 4ct.eu (ne odhad) — primary/accent jsou skutečné
          // firemní barvy, ne generický Tailwind zelená/modrá.
          primary: '#4BB349',
          secondary: '#9CD99A',
          accent: '#0066A4',
          // text-light/text-muted posunuty o stupeň tmavší oproti Tailwind default slate –
          // původní #94A3B8 mělo kontrast na bílém pozadí jen 2,6:1 (WCAG AA žádá 4,5:1 pro
          // běžný text). Ověřeno výpočtem, ne odhadem – pro 60+ uživatele důležité.
          'text-dark': '#1E293B',
          'text-light': '#475569', // 7,6:1 na bílé (AAA)
          'text-muted': '#64748B', // 4,8:1 na bílé (AA) – dřívější hodnota text-light
          'bg-light': '#F9FAFB',
          surface: '#FFFFFF',
          'surface-hover': '#F0FBF0',
          border: '#E2E8F0',
          'border-hover': '#CBD5E1',
          neutral: '#E2E8F0',
          error: '#EF4444',
          success: '#4BB349',
          warning: '#F59E0B',
        },
      screens: { 
        xl: '1440px', 
        lg: '1024px', 
        md: '768px', 
        sm: '375px' 
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'card': '0 2px 8px rgba(0,0,0,.10)'
      }
    },
  },
  plugins: [],
}


