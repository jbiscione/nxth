import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Add a cache-busting strategy for build outputs
  build: {
    rollupOptions: {
      output: {
        // Add a cache-busting parameter to file names
        chunkFileNames: 'assets/[name]-[hash]-' + Date.now().toString().slice(0, 8) + '.js',
        entryFileNames: 'assets/[name]-[hash]-' + Date.now().toString().slice(0, 8) + '.js',
        assetFileNames: 'assets/[name]-[hash]-' + Date.now().toString().slice(0, 8) + '.[ext]'
      }
    }
  },
  // Add CORS proxy configuration
  server: {
    cors: true,
    proxy: {
      // Proxy requests to external APIs
      '/api/external': {
        target: 'https://acrons.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending request to:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received response from:', req.url, 'Status:', proxyRes.statusCode);
          });
        }
      }
    }
  }
});