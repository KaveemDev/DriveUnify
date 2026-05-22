import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('react-window') || id.includes('react-virtualized')) return 'virtualized';
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) return 'redux';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      '@reduxjs/toolkit', 'react-redux',
      'lucide-react', 'react-hot-toast', 'clsx', 'date-fns',
    ],
  },
  server: {
    port: 5173,
    open: false,
  },
});
