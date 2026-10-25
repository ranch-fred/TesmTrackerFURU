import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { publicSupabaseConfig } from './src/public-env.js';
export default defineConfig(({ mode }) => {
  const config = publicSupabaseConfig({ ...loadEnv(mode, process.cwd(), ''), ...process.env });
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(config.url),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(config.key),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            charts: ['recharts'],
            pdf: ['jspdf'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
