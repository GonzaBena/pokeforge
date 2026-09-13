import type { NuzlockeDeath, NuzlockePlaythrough, Pokemon } from './types'
import { typeColor } from './typeColors'
import type { Locale } from './i18n/translations'

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

export function renderGraveyardCardHTML(
  playthrough: NuzlockePlaythrough,
  deaths: NuzlockeDeath[],
  pokemonMap: Map<number, Pokemon>,
  locale: Locale = 'es',
): string {
  if (deaths.length === 0) {
    return `
      <div class="team-card-empty">
        <i data-lucide="skull" class="team-card-empty__icon"></i>
        <h3>Sin bajas registradas</h3>
        <p>Tu equipo Nuzlocke sigue completo.</p>
      </div>
    `
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const rows = deaths
    .map((d) => {
      const p = pokemonMap.get(d.pokemonId)
      if (!p) return ''
      const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? ''
      const glow = typeColor(p.types[0] ?? 'normal')
      const level = d.atLevel !== null ? `Nv. ${d.atLevel}` : ''

      return `
        <div class="graveyard-card-item" style="--item-glow:${glow};">
          <span class="graveyard-card-item__dex">${dexNumber(p.id)}</span>
          <div class="graveyard-card-item__sprite-wrap">
            <img src="${sprite}" alt="${p.name}" loading="lazy" />
          </div>
          <h4 class="graveyard-card-item__name">${p.name}</h4>
          <div class="graveyard-card-item__meta">
            <span>${level}</span>
            <span>${d.area}</span>
          </div>
          <p class="graveyard-card-item__cause">${d.cause}</p>
          <span class="graveyard-card-item__date">${dateFormatter.format(new Date(`${d.date}T00:00:00`))}</span>
        </div>
      `
    })
    .join('')

  return `
    <div class="team-card-graphic nuzlocke-memorial-graphic">
      <div class="team-card-graphic__header">
        <div class="team-card-graphic__brand">
          <img src="/favicon.png" alt="PokeForge Logo" width="32" height="32" />
          <span class="team-card-graphic__title">MEMORIAL NUZLOCKE</span>
        </div>
        <span class="team-card-graphic__subtitle">${deaths.length} caídos — Run ${playthrough.id}</span>
      </div>

      <div class="nuzlocke-memorial-graphic__grid">
        ${rows}
      </div>

      <div class="team-card-graphic__footer">
        <span>pokeforges.netlify.app</span>
        <span>${dateFormatter.format(new Date())}</span>
      </div>
    </div>
  `
}
