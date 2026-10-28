import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig, type Plugin} from 'vite';
import {getPublicStoreSnapshot} from './server/db.js';

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));

function bdtechzenNetlifyAssetsPlugin(): Plugin {
  return {
    name: 'bdtechzen-netlify-assets',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(ROOT_DIR, 'dist');
      if (!fs.existsSync(distDir)) return;

      // 1. Copy /src/assets/images/* -> dist/src/assets/images/* so all product & hero photos load from Netlify CDN
      const srcImagesDir = path.resolve(ROOT_DIR, 'src', 'assets', 'images');
      const distImagesDir = path.join(distDir, 'src', 'assets', 'images');
      if (fs.existsSync(srcImagesDir)) {
        fs.mkdirSync(distImagesDir, {recursive: true});
        for (const file of fs.readdirSync(srcImagesDir)) {
          const srcFile = path.join(srcImagesDir, file);
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, path.join(distImagesDir, file));
          }
        }
      }

      // 2. Write sanitized public catalog snapshot -> dist/data/store-snapshot.json
      const dataDir = path.join(distDir, 'data');
      fs.mkdirSync(dataDir, {recursive: true});
      const snapshot = getPublicStoreSnapshot();
      fs.writeFileSync(
        path.join(dataDir, 'store-snapshot.json'),
        JSON.stringify(snapshot, null, 2),
        'utf-8'
      );

      // 3. Write Netlify _headers for fast global CDN asset caching
      const headersContent = [
        '/assets/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/src/assets/images/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        ''
      ].join('\n');
      fs.writeFileSync(path.join(distDir, '_headers'), headersContent, 'utf-8');

      // 4. Write _redirects for pure static Netlify Drag & Drop (skipped when netlify.toml functions routing is active)
      if (process.env.NETLIFY_FUNCTIONS_BUILD !== 'true') {
        fs.writeFileSync(path.join(distDir, '_redirects'), '/* /index.html 200\n', 'utf-8');
      }
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), bdtechzenNetlifyAssetsPlugin()],
    resolve: {
      alias: {
        '@': ROOT_DIR,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
