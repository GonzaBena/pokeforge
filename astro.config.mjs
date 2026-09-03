// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

const isBuild = process.argv.includes('build');

// https://astro.build/config
export default defineConfig({
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
