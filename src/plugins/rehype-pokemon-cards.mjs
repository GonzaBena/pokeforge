/**
 * Helper to capitalize words
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  if (!str) return '';
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Detect language/locale from vfile or attributes
 * @param {any} file
 * @param {Record<string, any>} [attrs]
 * @returns {'es' | 'en'}
 */
function detectLocale(file, attrs = {}) {
  if (attrs.lang) return String(attrs.lang).toLowerCase() === 'en' ? 'en' : 'es';
  if (attrs.locale) return String(attrs.locale).toLowerCase() === 'en' ? 'en' : 'es';
  const filePath = file?.history?.[0] || file?.path || file?.filename || '';
  if (/(?:^|[\\/])en(?:[\\/]|$)/i.test(filePath)) return 'en';
  if (/(?:^|[\\/])es(?:[\\/]|$)/i.test(filePath)) return 'es';
  return 'es';
}

/**
 * Parse HTML tag attributes into a key-value object
 * @param {string} attrsStr
 * @returns {Record<string, any>}
 */
function parseCardAttrs(attrsStr) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
  let m;
  while ((m = attrRegex.exec(attrsStr)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? true;
  }
  return attrs;
}

/**
 * Build HTML parts for a starter card
 * @param {Record<string, any>} attrs
 * @param {string} [fallbackSprite]
 * @param {'es' | 'en'} [locale]
 */
function buildCardParts(attrs, fallbackSprite = '', locale = 'es') {
  const isEn = locale === 'en';
  const name = attrs.name || attrs.nombre || 'Pokémon';

  // Nivel
  let level = attrs.level || attrs.nivel || attrs.lvl ? String(attrs.level || attrs.nivel || attrs.lvl).trim() : '';
  if (/^\d+(-\d+)?$/.test(level)) {
    level = isEn ? `Lv. ${level}` : `Nv. ${level}`;
  } else if (!level) {
    level = isEn ? 'Lv. ?' : 'Nv. ?';
  } else if (isEn && /^nv\.\s*/i.test(level)) {
    level = level.replace(/^nv\.\s*/i, 'Lv. ');
  } else if (!isEn && /^lv\.\s*/i.test(level)) {
    level = level.replace(/^lv\.\s*/i, 'Nv. ');
  }

  // Género (por defecto masculino U+2642)
  const rawGender = String(
    attrs.genero ||
    attrs.genre ||
    attrs.gender ||
    attrs.sex ||
    attrs.sexo ||
    ''
  ).trim().toLowerCase();

  let genderSymbol = '\u2642'; // U+2642 (♂)
  let genderClass = 'male';
  let genderLabel = isEn ? 'Male' : 'Macho';

  if (
    rawGender === 'none' ||
    rawGender === 'neutral' ||
    rawGender === 'sin' ||
    rawGender === 'genderless' ||
    rawGender === '-' ||
    rawGender === 'false'
  ) {
    genderSymbol = '';
  } else if (
    rawGender === 'f' ||
    rawGender === 'female' ||
    rawGender === 'femenino' ||
    rawGender === 'hembra' ||
    rawGender === 'h'
  ) {
    genderSymbol = '\u2640'; // U+2640 (♀)
    genderClass = 'female';
    genderLabel = isEn ? 'Female' : 'Hembra';
  }

  const genderHtml = genderSymbol
    ? `<span class="starter-card__gender starter-card__gender--${genderClass}" title="${genderLabel}" aria-label="${genderLabel}">${genderSymbol}</span>`
    : '';

  // Tipos
  const types = (attrs.types || attrs.type || 'normal')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const primaryType = (types[0] || 'normal').toLowerCase();
  const typeBadges = types
    .map((t) => {
      const cap = capitalize(t);
      return `<span class="type-badge" data-type="${t.toLowerCase()}">${cap}</span>`;
    })
    .join('\n    ');

  // Variante compacta: para listar pokemon salvajes de una zona (sprite de fondo, sin detalles)
  const isCompact = attrs.compact === true || attrs.compact === 'true';
  if (isCompact) {
    const wildTypeBadges = types
      .map((t) => `<span class="type-badge type-badge--sm" data-type="${t.toLowerCase()}">${capitalize(t)}</span>`)
      .join('\n      ');

    const beforeImg = `
<div class="wild-card" data-type="${primaryType}" title="${name} — ${level}">
  <div class="wild-card__sprite-wrap">`;

    const afterImg = `  </div>
  <div class="wild-card__footer">
    <div class="wild-card__title">
      <div class="wild-card__types">
      ${wildTypeBadges}
      </div>
      <span class="wild-card__name">${name}</span>
    </div>
    <span class="wild-card__level">${level}</span>
  </div>
</div>`;

    return { beforeImg, afterImg, sprite: attrs.sprite || attrs.image || fallbackSprite, name };
  }

  // Habilidad y Objeto
  const ability = attrs.ability || attrs.habilidad;
  const abilityLabel =
    attrs['ability-label'] ||
    attrs.abilityLabel ||
    attrs['habilidad-label'] ||
    attrs.habilidadLabel ||
    (isEn ? 'Ability' : 'Habilidad');

  const item = attrs.item || attrs.objeto || attrs['held-item'] || attrs.heldItem;
  const itemLabel =
    attrs['item-label'] ||
    attrs.itemLabel ||
    attrs['objeto-label'] ||
    attrs.objetoLabel ||
    (isEn ? 'Item' : 'Objeto');

  let traitsHtml = '';
  if (ability || item) {
    let traitItems = '';
    if (ability) {
      traitItems += `
    <div class="starter-card__trait" title="${abilityLabel}: ${ability}">
      <span class="starter-card__trait-label">
        <svg class="starter-card__trait-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span>${abilityLabel}</span>
      </span>
      <span class="starter-card__trait-val">${ability}</span>
    </div>`;
    }
    if (item) {
      traitItems += `
    <div class="starter-card__trait" title="${itemLabel}: ${item}">
      <span class="starter-card__trait-label">
        <svg class="starter-card__trait-icon" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span>${itemLabel}</span>
      </span>
      <span class="starter-card__trait-val">${item}</span>
    </div>`;
    }

    traitsHtml = `
  <div class="starter-card__traits">${traitItems}
  </div>`;
  }

  // Movimientos
  let movesHtml = '';
  const movesAttr = attrs.moves || attrs.ataques || attrs.movimientos;
  if (movesAttr) {
    let moveList = String(movesAttr)
      .split(',')
      .map((m) => m.trim());

    // Padding opcional para rellenar hasta N ataques (por defecto 4 si se pasa pad-moves como booleano)
    const padCount =
      attrs['pad-moves'] === true || attrs.padMoves === true
        ? 4
        : Number(attrs['pad-moves'] || attrs.padMoves || attrs['fill-moves'] || attrs.fillMoves) || 0;
    while (padCount > 0 && moveList.length < padCount) {
      moveList.push('-');
    }

    if (moveList.length > 0 && moveList.some((m) => m !== '')) {
      const movesLabel =
        attrs['moves-label'] ||
        attrs.movesLabel ||
        attrs['ataques-label'] ||
        attrs.ataquesLabel ||
        (isEn ? 'Moves' : 'Ataques');

      const items = moveList
        .map((m) => {
          const isEmpty =
            !m ||
            m === '-' ||
            m === '--' ||
            m === '---' ||
            m === '—' ||
            m.toLowerCase() === 'vacio' ||
            m.toLowerCase() === 'vacío' ||
            m.toLowerCase() === 'empty' ||
            m.toLowerCase() === 'none';

          if (isEmpty) {
            return `
    <div class="starter-card__move-item starter-card__move-item--empty">
      <span class="starter-card__move-dot starter-card__move-dot--empty"></span>
      <span class="starter-card__move-name">—</span>
    </div>`;
          }

          return `
    <div class="starter-card__move-item" title="${m}">
      <span class="starter-card__move-dot"></span>
      <span class="starter-card__move-name">${m}</span>
    </div>`;
        })
        .join('');

      movesHtml = `
  <div class="starter-card__moves">
    <span class="starter-card__moves-label">${movesLabel}</span>${items}
  </div>`;
    }
  }

  // Clases y atributos
  const cardClasses = ['starter-card'];
  const forStarter =
    attrs.for || attrs.forStarter || attrs['for-starter'] || attrs['data-for-starter'];
  const isActive =
    attrs.active === true ||
    attrs.active === 'true' ||
    (forStarter && String(forStarter).toLowerCase() === 'bulbasaur');
  if (isActive) {
    cardClasses.push('is-active');
  }

  const forAttr = forStarter ? ` data-for-starter="${String(forStarter).toLowerCase()}"` : '';

  const beforeImg = `
<div class="${cardClasses.join(' ')}" data-type="${primaryType}"${forAttr}>
  <div class="starter-card__side">
    <div class="starter-card__sprite-wrap">
      <div class="starter-card__sprite-bg"></div>`;

  const afterImg = `    </div>
    <div class="starter-card__types">
      ${typeBadges}
    </div>
  </div>
  <div class="starter-card__main">
    <div class="starter-card__top">
      <h4 class="starter-card__name"><span class="starter-card__name-text">${name}</span>${genderHtml}</h4>
      <span class="starter-card__level">${level}</span>
    </div>${traitsHtml}${movesHtml}
  </div>
</div>`;

  return { beforeImg, afterImg, sprite: attrs.sprite || attrs.image || fallbackSprite, name };
}

/**
 * Extract file extension from URL
 * @param {string} rawUrl
 * @returns {string}
 */
function extractExtension(rawUrl) {
  try {
    const clean = String(rawUrl).split('?')[0].split('#')[0];
    const parts = clean.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()?.trim().toUpperCase() || '';
      if (ext.length >= 1 && ext.length <= 5 && !ext.includes('/')) {
        return ext;
      }
    }
  } catch {}
  return 'FILE';
}

/**
 * Get icon and badge class by extension
 * @param {string} ext
 * @returns {{ icon: string, badgeClass: string }}
 */
function getDownloadFileInfo(ext) {
  switch (ext) {
    case 'PDF':
      return { icon: 'file-text', badgeClass: 'badge-pdf' };
    case 'PNG':
    case 'JPG':
    case 'JPEG':
    case 'WEBP':
    case 'SVG':
    case 'GIF':
    case 'AVIF':
      return { icon: 'image', badgeClass: 'badge-image' };
    case 'ZIP':
    case 'RAR':
    case '7Z':
    case 'TAR':
    case 'GZ':
      return { icon: 'archive', badgeClass: 'badge-archive' };
    case 'SAV':
    case 'DAT':
    case 'BIN':
    case 'PKM':
    case 'PK9':
      return { icon: 'hard-drive', badgeClass: 'badge-save' };
    case 'JSON':
    case 'CSV':
    case 'XLSX':
    case 'XLS':
    case 'TXT':
      return { icon: 'file-spreadsheet', badgeClass: 'badge-data' };
    default:
      return { icon: 'file-down', badgeClass: 'badge-default' };
  }
}

/**
 * Render a <download-card> HTML string
 * @param {Record<string, any>} attrs
 * @param {'es' | 'en'} [locale]
 * @returns {string}
 */
function renderDownloadCardHtml(attrs, locale = 'es') {
  const isEn = locale === 'en';
  const fileUrl = attrs.path || attrs.url || attrs.src || attrs.href || '#';
  const fileTitle = attrs.text || attrs.title || attrs.name || fileUrl.split('/').pop() || (isEn ? 'Download' : 'Descarga');
  const description = attrs.description || attrs.desc || '';
  const size = attrs.size || attrs.tamano || '';
  const detectedExt = (attrs.format || extractExtension(fileUrl)).toUpperCase();
  const { icon, badgeClass } = getDownloadFileInfo(detectedExt);
  const actionLabel = attrs.btnText || attrs.buttonText || (isEn ? 'Download' : 'Descargar');
  const fileNameAttr = attrs.fileName ? ` download="${attrs.fileName}"` : ' download';

  return `<div class="download-card">
  <div class="download-card__icon ${badgeClass}" aria-hidden="true">
    <i data-lucide="${icon}"></i>
  </div>
  <div class="download-card__body">
    <div class="download-card__meta">
      <span class="download-badge ${badgeClass}">${detectedExt}</span>
      ${size ? `<span class="download-size">${size}</span>` : ''}
    </div>
    <h4 class="download-card__title">${fileTitle}</h4>
    ${description ? `<p class="download-card__desc">${description}</p>` : ''}
  </div>
  <div class="download-card__action">
    <a href="${fileUrl}"${fileNameAttr} class="download-btn" aria-label="${actionLabel}: ${fileTitle}">
      <i data-lucide="download"></i>
      <span>${actionLabel}</span>
    </a>
  </div>
</div>`;
}

/**
 * Replace container tags and rival selector in an HTML string
 * @param {string} str
 * @param {'es' | 'en'} [locale]
 * @returns {string}
 */
function replaceContainers(str, locale = 'es') {
  const isEn = locale === 'en';
  let output = str;

  // 1. Selector de Rival
  output = output.replace(/<rival-selector\b[^>]*>(?:<\/rival-selector>)?/gi, () => {
    const label = isEn ? 'Which was your starter?' : '¿Cuál fue tu inicial?';
    return `<div class="rival-starter-selector">
  <span class="rival-starter-selector__label">${label}</span>
  <div class="rival-starter-selector__options">
    <button type="button" class="rival-starter-selector__btn is-active" data-starter="bulbasaur">
      <span class="rival-starter-selector__dot"></span>
      <span>Bulbasaur</span>
    </button>
    <button type="button" class="rival-starter-selector__btn" data-starter="charmander">
      <span class="rival-starter-selector__dot"></span>
      <span>Charmander</span>
    </button>
    <button type="button" class="rival-starter-selector__btn" data-starter="squirtle">
      <span class="rival-starter-selector__dot"></span>
      <span>Squirtle</span>
    </button>
  </div>
</div>`;
  });

  // 2. Ranuras de rival
  output = output.replace(/<rival-slot\b[^>]*>/gi, '<div class="rival-slot-container">');
  output = output.replace(/<\/rival-slot>/gi, '</div>');

  // 3. Showcase
  output = output.replace(
    /<(?:pokemon-showcase|showcase)\b[^>]*>/gi,
    '<div class="starter-showcase">\n<div class="starter-showcase__grid">'
  );
  output = output.replace(/<\/(?:pokemon-showcase|showcase)>/gi, '</div>\n</div>');

  // 4. Download Card
  output = output.replace(
    /<(?:download-card|download)\b([^>]*)>(?:<\/(?:download-card|download)>)?|<(?:download-card|download)\b([^/>]*)\/>/gi,
    (_match, attrs1, attrs2) => {
      const attrs = parseCardAttrs(attrs1 || attrs2 || '');
      return renderDownloadCardHtml(attrs, locale);
    }
  );

  return output;
}

/**
 * Transform text containing <pokemon-card> into MDAST nodes (splitting around images)
 * @param {string} text
 * @param {'es' | 'en'} [locale]
 * @returns {any[]}
 */
function transformCardsToNodes(text, locale = 'es') {
  const prepared = replaceContainers(text, locale);
  const cardRegex =
    /<(?:pokemon-card|card)\b([^>]*)>([\s\S]*?)<\/(?:pokemon-card|card)>|<(?:pokemon-card|card)\b([^/>]*)\/>/gi;

  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = cardRegex.exec(prepared)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        type: 'html',
        value: prepared.slice(lastIndex, match.index)
      });
    }

    const attrsStr = match[1] || match[3] || '';
    const content = match[2] || '';
    const attrs = parseCardAttrs(attrsStr);
    const cardLocale = attrs.lang || attrs.locale || locale;

    let sprite = '';
    if (content) {
      const imgMatch = /!\[([^\]]*)\]\(([^)]+)\)/.exec(content);
      if (imgMatch) {
        sprite = imgMatch[2].trim();
      }
    }

    const { beforeImg, afterImg, name } = buildCardParts(attrs, '', cardLocale);

    nodes.push({ type: 'html', value: beforeImg });
    if (sprite) {
      nodes.push({ type: 'image', url: sprite, alt: name });
    }
    nodes.push({ type: 'html', value: afterImg });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < prepared.length) {
    nodes.push({
      type: 'html',
      value: prepared.slice(lastIndex)
    });
  }

  return nodes;
}

/**
 * Process a paragraph node that may contain <pokemon-card> tags and markdown image nodes
 * @param {any} paraNode
 * @param {'es' | 'en'} [locale]
 * @returns {any[]}
 */
function processParagraph(paraNode, locale = 'es') {
  const result = [];
  let currentCard = null;

  for (const child of paraNode.children) {
    if (child.type === 'html') {
      let val = child.value;

      // Check for opening card tag
      const openMatch = /<(?:pokemon-card|card)\b([^>]*)>/i.exec(val);
      if (openMatch) {
        const before = val.slice(0, openMatch.index);
        if (before.trim()) {
          result.push({ type: 'html', value: replaceContainers(before, locale) });
        }
        const attrs = parseCardAttrs(openMatch[1]);
        currentCard = { attrs, imageNode: null };
        val = val.slice(openMatch.index + openMatch[0].length);
      }

      // Check for closing card tag
      const closeMatch = /<\/(?:pokemon-card|card)>/i.exec(val);
      if (closeMatch && currentCard) {
        const cardLocale = currentCard.attrs.lang || currentCard.attrs.locale || locale;
        const { beforeImg, afterImg, sprite, name } = buildCardParts(currentCard.attrs, '', cardLocale);
        result.push({ type: 'html', value: beforeImg });
        if (currentCard.imageNode) {
          result.push(currentCard.imageNode);
        } else if (sprite) {
          result.push({ type: 'image', url: sprite, alt: name });
        }
        result.push({ type: 'html', value: afterImg });
        currentCard = null;

        const after = val.slice(closeMatch.index + closeMatch[0].length);
        if (after.trim()) {
          result.push({ type: 'html', value: replaceContainers(after, locale) });
        }
        continue;
      }

      if (val.trim()) {
        result.push({ type: 'html', value: replaceContainers(val, locale) });
      }
    } else if (child.type === 'image') {
      if (currentCard) {
        currentCard.imageNode = child;
      } else {
        result.push(child);
      }
    } else if (child.type === 'text') {
      if (!currentCard && child.value.trim()) {
        result.push(child);
      }
    } else {
      result.push(child);
    }
  }

  return result;
}

/**
 * Remark plugin to transform custom Pokémon tags
 */
export function remarkPokemonCards() {
  return (tree, file) => {
    const locale = detectLocale(file);
    function processChildren(parent) {
      if (!parent || !Array.isArray(parent.children)) return;

      const newChildren = [];
      for (const child of parent.children) {
        if ((child.type === 'html' || child.type === 'code') && typeof child.value === 'string') {
          const val = child.value;
          if (
            val.includes('pokemon-') ||
            val.includes('rival-') ||
            val.includes('card') ||
            val.includes('showcase')
          ) {
            const transformed = transformCardsToNodes(val, locale);
            newChildren.push(...transformed);
            continue;
          }
        }

        if (child.type === 'paragraph' && Array.isArray(child.children)) {
          const hasPokemon = child.children.some(
            (c) =>
              (c.type === 'html' || c.type === 'text') &&
              typeof c.value === 'string' &&
              (c.value.includes('pokemon-') ||
                c.value.includes('rival-') ||
                c.value.includes('card') ||
                c.value.includes('showcase'))
          );
          if (hasPokemon) {
            const transformed = processParagraph(child, locale);
            newChildren.push(...transformed);
            continue;
          }
        }

        if (child.children) {
          processChildren(child);
        }
        newChildren.push(child);
      }
      parent.children = newChildren;
    }

    processChildren(tree);
  };
}

/**
 * Rehype plugin fallback
 */
export function rehypePokemonCards() {
  return (tree, file) => {
    const locale = detectLocale(file);
    function walkRehype(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'element' && node.tagName === 'input' && node.properties?.type === 'checkbox') {
        if ('disabled' in node.properties) {
          delete node.properties.disabled;
        }
      }
      if (node.type === 'raw' && typeof node.value === 'string') {
        const val = node.value;
        if (
          val.includes('pokemon-') ||
          val.includes('rival-') ||
          val.includes('card') ||
          val.includes('showcase')
        ) {
          node.value = replaceContainers(val, locale);
        }
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          walkRehype(child);
        }
      }
    }
    walkRehype(tree);
  };
}
