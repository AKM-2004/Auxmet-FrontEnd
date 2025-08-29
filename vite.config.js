import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Forward API calls to backend during development to avoid CORS issues
        '/api': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React and core libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Animation libraries
            'animation-vendor': ['framer-motion'],
            // UI libraries
            'ui-vendor': ['lucide-react'],
            // Let Three.js be handled automatically by Vite for better optimization
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  }
})
