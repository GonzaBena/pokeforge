import { defineMiddleware } from "astro:middleware";
import { getCollection } from "astro:content";

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Detectar rutas del estilo /blog/page/:page o /es/blog/page/:page
  const match = pathname.match(/^(\/(?:es\/)?blog)\/page\/([^/]+)\/?$/);
  if (match) {
    const baseBlog = match[1];
    const pageParam = match[2];
    const pageNum = parseInt(pageParam, 10);
    const isEs = baseBlog.startsWith("/es");
    const localePrefix = isEs ? "es/" : "en/";

    // Si no es un número válido o es menor o igual a 0, redirigir al blog base
    if (isNaN(pageNum) || pageNum < 1) {
      return context.redirect(`${baseBlog}/`, 302);
    }

    // Página 1 siempre redirige canónicamente a la raíz del blog
    if (pageNum === 1) {
      return context.redirect(`${baseBlog}/`, 301);
    }

    // Calcular cuántas páginas existen actualmente
    const posts = await getCollection("blog", ({ id, data }) => {
      return id.startsWith(localePrefix) && !data.parentGuide;
    });

    const PAGE_SIZE = 12;
    const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));

    // Si la página solicitada excede las páginas reales disponibles
    if (pageNum > totalPages) {
      if (totalPages === 1) {
        return context.redirect(`${baseBlog}/`, 302);
      }
      return context.redirect(`${baseBlog}/page/${totalPages}/`, 302);
    }
  }

  return next();
});
