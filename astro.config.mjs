// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import fs from 'node:fs';

/**
 * @returns {import('astro').AstroIntegration}
 */
function swVersionPlugin() {
  return {
    name: 'sw-version-stamp',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const swUrl = new URL('sw.js', dir);
        if (fs.existsSync(swUrl)) {
          let content = fs.readFileSync(swUrl, 'utf8');
          const version = `pokeforge-${Date.now()}`;
          content = content.replace(/const CACHE_NAME = ['"][^'"]+['"];/, `const CACHE_NAME = '${version}';`);
          fs.writeFileSync(swUrl, content, 'utf8');
        }
      }
    }
  };
}

const isBuild = process.argv.includes('build');

// https://astro.build/config
export default defineConfig({
  integrations: [swVersionPlugin()],
  adapter: isBuild ? netlify() : undefined,
  output: 'static',
  build: {
    format: 'directory'
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  }
});
