// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  adapter: netlify(),
  output: 'static',
  build: {
    format: 'directory'
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  }
});
