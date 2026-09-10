import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "{en,es}/**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      author: z.string().default("poketeam"),
      category: z.enum([
        "guias",
        "curiosidades",
        "competitivo",
        "novedades",
        "recursos",
      ]),
      tags: z.array(z.string()).default([]),
      coverImage: z.union([image(), z.string()]).optional(),
      coverImageFit: z.enum(["contain", "cover"]).default("contain"),
      featured: z.boolean().default(false),
      readingTime: z.string().optional(),
      translation: z.string().optional(),
      parentGuide: z.string().optional(),
      order: z.number().optional(),
      guideId: z.string().optional(),
      isGuideHub: z.boolean().default(false),
      inProgress: z.boolean().default(false),
      isPlanned: z.boolean().default(false),
      plannedChapters: z
        .array(
          z.object({
            title: z.string(),
            description: z.string().optional(),
            order: z.number().optional(),
          }),
        )
        .optional()
        .default([]),
      downloads: z
        .array(
          z.object({
            title: z.string().optional(),
            text: z.string().optional(),
            path: z.string().optional(),
            url: z.string().optional(),
            src: z.string().optional(),
            href: z.string().optional(),
            size: z.string().optional(),
            format: z.string().optional(),
            description: z.string().optional(),
            fileName: z.string().optional(),
          }),
        )
        .optional()
        .default([]),
    }),
});

export const collections = { blog };
