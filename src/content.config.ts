import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('poketeam'),
    category: z.enum(['guias', 'curiosidades', 'competitivo', 'novedades']),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    featured: z.boolean().default(false),
    readingTime: z.string().optional(),
    translation: z.string().optional(),
  }),
});

export const collections = { blog };
