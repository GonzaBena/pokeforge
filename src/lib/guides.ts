import type { CollectionEntry } from "astro:content";
import { getLocalizedPath, type Locale } from "./i18n/translations";

/**
 * Obtiene el slug limpio de una entrada de blog, removiendo el prefijo de idioma,
 * la extensión .md y el sufijo /index si es la entrada raíz de una subcarpeta.
 */
export function getPostSlug(id: string, locale: Locale): string {
  return id
    .replace(new RegExp(`^${locale}/`), "")
    .replace(/\/index(\.md)?$/, "")
    .replace(/\.md$/, "");
}

/**
 * Genera la URL pública localizada para cualquier entrada del blog (artículo, guía o capítulo).
 */
export function getPostUrl(id: string, locale: Locale): string {
  const cleanSlug = getPostSlug(id, locale);
  return getLocalizedPath(`/blog/${cleanSlug}/`, locale);
}

export interface GuideHierarchy {
  isChapter: boolean;
  isHub: boolean;
  parentPost: CollectionEntry<"blog"> | null;
  parentUrl: string | null;
  chapters: CollectionEntry<"blog">[];
  currentIndex: number;
  currentNumber: number;
  totalChapters: number;
  prevChapter: CollectionEntry<"blog"> | null;
  prevUrl: string | null;
  nextChapter: CollectionEntry<"blog"> | null;
  nextUrl: string | null;
}

/**
 * Analiza la relación de una entrada con el sistema de guías (si es capítulo hijo o hub central).
 */
export function getGuideHierarchy(
  currentPost: CollectionEntry<"blog">,
  allLocalePosts: CollectionEntry<"blog">[],
  locale: Locale
): GuideHierarchy {
  const currentSlug = getPostSlug(currentPost.id, locale);
  const parentGuideId = currentPost.data.parentGuide;

  // CASO 1: Es un capítulo hijo
  if (parentGuideId) {
    const parentPost =
      allLocalePosts.find((p) => {
        const slug = getPostSlug(p.id, locale);
        return slug === parentGuideId || p.data.guideId === parentGuideId;
      }) ?? null;

    const chapters = allLocalePosts
      .filter((p) => p.data.parentGuide === parentGuideId)
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));

    const currentIndex = chapters.findIndex((p) => p.id === currentPost.id);
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter =
      currentIndex >= 0 && currentIndex < chapters.length - 1
        ? chapters[currentIndex + 1]
        : null;

    return {
      isChapter: true,
      isHub: false,
      parentPost,
      parentUrl: parentPost ? getPostUrl(parentPost.id, locale) : null,
      chapters,
      currentIndex,
      currentNumber: currentPost.data.order ?? (currentIndex + 1),
      totalChapters: chapters.length,
      prevChapter,
      prevUrl: prevChapter ? getPostUrl(prevChapter.id, locale) : null,
      nextChapter,
      nextUrl: nextChapter ? getPostUrl(nextChapter.id, locale) : null,
    };
  }

  // CASO 2: Es una guía central (Hub) o tiene capítulos asociados
  const guideIdentifier = currentPost.data.guideId ?? currentSlug;
  const childChapters = allLocalePosts
    .filter(
      (p) =>
        p.data.parentGuide === guideIdentifier ||
        p.data.parentGuide === currentSlug
    )
    .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));

  if (childChapters.length > 0 || currentPost.data.isGuideHub) {
    return {
      isChapter: false,
      isHub: true,
      parentPost: null,
      parentUrl: null,
      chapters: childChapters,
      currentIndex: -1,
      currentNumber: 0,
      totalChapters: childChapters.length,
      prevChapter: null,
      prevUrl: null,
      nextChapter: null,
      nextUrl: null,
    };
  }

  // CASO 3: Artículo regular independiente
  return {
    isChapter: false,
    isHub: false,
    parentPost: null,
    parentUrl: null,
    chapters: [],
    currentIndex: -1,
    currentNumber: 0,
    totalChapters: 0,
    prevChapter: null,
    prevUrl: null,
    nextChapter: null,
    nextUrl: null,
  };
}

/**
 * Extrae la URL (src) de la portada de un post, ya sea un objeto ImageMetadata
 * procesado por Astro, una URL externa en string, o un fallback por defecto.
 */
export function getCoverImageSrc(
  coverImage: { src: string } | string | undefined | null,
  fallback = "/favicon.png"
): string {
  if (!coverImage) return fallback;
  if (typeof coverImage === "object" && "src" in coverImage) {
    return coverImage.src;
  }
  return typeof coverImage === "string" && coverImage.trim().length > 0
    ? coverImage
    : fallback;
}

