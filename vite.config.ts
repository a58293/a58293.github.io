import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {mediaAssetsPlugin} from './scripts/media-assets-plugin';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default defineConfig(async () => {
  return {
    publicDir: false as const,
    plugins: [react(), tailwindcss(), await mediaAssetsPlugin(fileURLToPath(new URL('.', import.meta.url)))],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    server: {
      host: '127.0.0.1',
      strictPort: true,
      headers: securityHeaders,
      fs: {
        deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/素材管理/**', '**/素材库/**', '**/public/images/**', '**/docs/**', '**/artifacts/**', '**/scripts/**'],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    preview: {
      host: '127.0.0.1',
      headers: {
        ...securityHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.app.tcloudbase.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'",
      },
    },
  };
});
