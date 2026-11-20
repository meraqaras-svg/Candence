import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const DEFAULT_FIREBASE_WEB_CONFIG = {
  apiKey: 'AIzaSyCFU6YRhTCVyzJJXZcDF14IFKhRs8eemT0',
  authDomain: 'muzikapptone-c6971.firebaseapp.com',
  projectId: 'muzikapptone-c6971',
  storageBucket: 'muzikapptone-c6971.firebasestorage.app',
  messagingSenderId: '49571646885',
  appId: '1:49571646885:web:e044ff2b4ec431fae0494c',
  firestoreDatabaseId: '(default)',
};

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return '';
  const stripped = raw.trim().replace(/^["']+|["']+$/g, '').trim();
  if (!stripped) return '';
  const upper = stripped.toUpperCase();
  if (
    upper.startsWith('MY_') ||
    upper.startsWith('YOUR_') ||
    upper.startsWith('<') ||
    upper === 'UNDEFINED' ||
    upper === 'NULL' ||
    stripped === 'remixed-project-id'
  ) {
    return '';
  }
  return stripped;
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const ytKey =
    cleanEnvValue(env.VITE_YOUTUBE_API_KEY) ||
    cleanEnvValue(env.YOUTUBE_API_KEY) ||
    cleanEnvValue(process.env.VITE_YOUTUBE_API_KEY) ||
    cleanEnvValue(process.env.YOUTUBE_API_KEY) ||
    '';

  const pickFb = (viteName: string, plainName: string, fallback: string) =>
    cleanEnvValue(env[viteName]) ||
    cleanEnvValue(env[plainName]) ||
    cleanEnvValue(process.env[viteName]) ||
    cleanEnvValue(process.env[plainName]) ||
    fallback;

  const rawFbApiKey = pickFb('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY', '');
  const fbApiKey = rawFbApiKey.startsWith('AIza')
    ? rawFbApiKey
    : DEFAULT_FIREBASE_WEB_CONFIG.apiKey;
  const fbAuthDomain = pickFb(
    'VITE_FIREBASE_AUTH_DOMAIN',
    'FIREBASE_AUTH_DOMAIN',
    DEFAULT_FIREBASE_WEB_CONFIG.authDomain
  );
  const fbProjectId = pickFb(
    'VITE_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT_ID',
    DEFAULT_FIREBASE_WEB_CONFIG.projectId
  );
  const fbStorageBucket = pickFb(
    'VITE_FIREBASE_STORAGE_BUCKET',
    'FIREBASE_STORAGE_BUCKET',
    DEFAULT_FIREBASE_WEB_CONFIG.storageBucket
  );
  const fbMessagingSenderId = pickFb(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_MESSAGING_SENDER_ID',
    DEFAULT_FIREBASE_WEB_CONFIG.messagingSenderId
  );
  const fbAppId = pickFb(
    'VITE_FIREBASE_APP_ID',
    'FIREBASE_APP_ID',
    DEFAULT_FIREBASE_WEB_CONFIG.appId
  );
  const fbDatabaseId = pickFb(
    'VITE_FIREBASE_FIRESTORE_DATABASE_ID',
    'FIREBASE_FIRESTORE_DATABASE_ID',
    DEFAULT_FIREBASE_WEB_CONFIG.firestoreDatabaseId
  );

  return {
    define: {
      'process.env.YOUTUBE_API_KEY': JSON.stringify(ytKey),
      'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify(ytKey),
      'process.env.FIREBASE_API_KEY': JSON.stringify(fbApiKey),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(fbApiKey),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(fbApiKey),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(fbAuthDomain),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(fbAuthDomain),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(fbAuthDomain),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(fbProjectId),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(fbProjectId),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(fbProjectId),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(fbStorageBucket),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(fbStorageBucket),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(fbStorageBucket),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(fbMessagingSenderId),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(fbMessagingSenderId),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(fbMessagingSenderId),
      'process.env.FIREBASE_APP_ID': JSON.stringify(fbAppId),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(fbAppId),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(fbAppId),
      'process.env.FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(fbDatabaseId),
      'process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(fbDatabaseId),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(fbDatabaseId),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'NYXON',
          short_name: 'NYXON',
          description:
            'NYXON — Sıvı cam arayüzlü yeni nesil müzik çalar, çevrimdışı ses kasası ve bulut eşitleme.',
          theme_color: '#050508',
          background_color: '#050508',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
