import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openAiProxyPort = env.OPENAI_PROXY_PORT || '8792'

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Urban Analytics',
        short_name: 'UrbanAI',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      devOptions: {
        enabled: false, // 🔥 vypnout SW ve vývojovém režimu
      }
    })
  ],
  server: {
    port: 5179,
    host: true, // Listen on all network interfaces (auto-detect)
    strictPort: false, // Try next available port if 5179 is taken
    cors: true, // Enable CORS
    proxy: {
      '/api/openai': {
        target: `http://127.0.0.1:${openAiProxyPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'lucide-react': ['lucide-react'],
          'recharts': ['recharts'],
          'echarts': ['echarts', 'echarts-for-react'],
          'pdf-utils': ['pdfjs-dist', 'html2canvas', 'jspdf'],
          
          // AI components
          'ai-components': [
            './src/components/AIWeightManager.jsx',
            './src/components/AdvancedAIAssistant.jsx',
            './src/components/ContextAwareAIWeightManager.jsx'
          ],
          
          // Chart components
          'chart-components': [
            './src/components/RadarChartAdvanced.jsx',
            './src/components/ExpandableRadarChart.jsx',
            './src/components/WeightedHeatmap.jsx',
            './src/components/AdvancedHeatmap.jsx'
          ],
          
          // Heavy components
          'heavy-components': [
            './src/components/ComparisonDashboard.jsx',
            './src/components/StepComparison.jsx',
            './src/components/StepUpload.jsx',
            './src/components/StepResults.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Suppress eval warnings for PDF.js
    commonjsOptions: {
      ignore: ['pdfjs-dist']
    }
  },
  define: {
    // Suppress eval warnings
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
  }
})