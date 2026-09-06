// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import fs from 'node:fs';
import { unified } from '@astrojs/markdown-remark';
import { remarkPokemonCards, rehypePokemonCards } from './src/plugins/rehype-pokemon-cards.mjs';

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

/**
 * @returns {import('astro').AstroIntegration}
 */
function buildPaginationRedirectsPlugin() {
  return {
    name: 'pagination-redirects-stamp',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const redirectsUrl = new URL('_redirects', dir);
        if (fs.existsSync(redirectsUrl)) {
          let content = fs.readFileSync(redirectsUrl, 'utf8');

          /**
           * @param {string} subPath
           * @returns {number}
           */
          const getMaxPage = (subPath) => {
            const pageDir = new URL(subPath, dir);
            if (!fs.existsSync(pageDir)) return 1;
            const entries = fs.readdirSync(pageDir);
            const nums = entries.map((e) => parseInt(e, 10)).filter((n) => !isNaN(n));
            return nums.length > 0 ? Math.max(...nums) : 1;
          };

          const maxEn = getMaxPage('blog/page/');
          const maxEs = getMaxPage('es/blog/page/');

          const targetEn = maxEn > 1 ? `/blog/page/${maxEn}/` : '/blog/';
          const targetEs = maxEs > 1 ? `/es/blog/page/${maxEs}/` : '/es/blog/';

          content = content.replace(/\/blog\/page\/\*\s+.*302/, `/blog/page/*  ${targetEn}  302`);
          content = content.replace(/\/es\/blog\/page\/\*\s+.*302/, `/es/blog/page/*  ${targetEs}  302`);

          fs.writeFileSync(redirectsUrl, content, 'utf8');
        }
      }
    }
  };
}

const isBuild = process.argv.includes('build');

// https://astro.build/config
export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkPokemonCards],
      rehypePlugins: [rehypePokemonCards]
    })
  },
  integrations: [swVersionPlugin(), buildPaginationRedirectsPlugin()],
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
