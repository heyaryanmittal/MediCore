import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.REACT_APP_API_URL || env.VITE_API_URL || (mode === 'production' ? 'https://medi-core-backend.vercel.app/api' : 'http://localhost:5000/api');
  const discordWebhookUrl = env.REACT_APP_DISCORD_WEBHOOK_URL || env.VITE_DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1521494519663558710/qXLELBMiZYEQrXBu15leEkwXkcWzryRh3YKBgi0vn5S_cIsl51n3Wo6x2fklcbrcGrAl';

  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(apiUrl),
      'process.env.REACT_APP_DISCORD_WEBHOOK_URL': JSON.stringify(discordWebhookUrl),
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'build',
    },
  };
});

