import {defineConfig} from 'astro/config';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import patchAstroRedirects from './src/integrations/patch-astro-redirects.mjs';
import ituSitemap from './src/integrations/sitemap.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const site = process.env.IT_LAB_SITE ?? 'http://localhost:4331';
const base = process.env.IT_LAB_BASE ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'never',
  integrations: [ituSitemap(), patchAstroRedirects()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
});
