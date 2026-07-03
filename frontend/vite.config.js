import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config for HealthGuardAI Frontend
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      // Expose REACT_APP_BACKEND_URL to the app via import.meta.env
      'import.meta.env.REACT_APP_BACKEND_URL': JSON.stringify(env.REACT_APP_BACKEND_URL || ''),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      hmr: {
        clientPort: 443,
        protocol: 'wss',
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
    },
  }
})
