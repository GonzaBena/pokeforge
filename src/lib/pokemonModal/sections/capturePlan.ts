import { buildCaptureSteps, resolveAcquisitionSource, type CaptureStep } from '../../capturePlan'
import { getCurrentLocale, getTranslations, type Translations } from '../../i18n/translations'
import type { AcquisitionRow } from '../../types'
import type { RenderContext } from '../types'
import { dexNumber, typeBadgesHtml } from '../utils'

function renderAcquisitionCard(
  pokemonName: string,
  rows: AcquisitionRow[],
  selectedGame: string,
  t: Translations,
): string {
  const resolution = resolveAcquisitionSource(rows, selectedGame)

  if (resolution.rows.length === 0) {
    return `<p class="capture-step__acquisition-empty">${t.modal.capturePlanNoData}</p>`
  }

  const rowsHtml = resolution.rows
    .slice(0, 4)
    .map(
      (r) => `
        <li class="capture-acquisition__row">
          <span class="capture-acquisition__location">${r.location}</span>
          <span class="capture-acquisition__method">${r.method}</span>
        </li>`,
    )
    .join('')

  const fallbackNoteHtml = resolution.usedFallback
    ? `<p class="capture-acquisition__fallback-note">${t.modal.capturePlanFallbackGame}</p>`
    : ''

  return `
    <div class="capture-acquisition">
      <p class="capture-acquisition__intro">${t.modal.capturePlanGetBase.replace('{name}', pokemonName)}</p>
      ${fallbackNoteHtml}
      <ul class="capture-acquisition__list">${rowsHtml}</ul>
    </div>
  `
}

function renderStep(
  step: CaptureStep,
  index: number,
  ctx: RenderContext,
  t: Translations,
): string {
  const p = ctx.allById.get(step.node.speciesId)
  if (!p) return ''

  const isCurrentModal = step.node.speciesId === ctx.pokemon.id
  const clickable = !isCurrentModal
    ? ` data-evolution-pick data-pokemon-id="${step.node.speciesId}"`
    : ''

  const marker = step.isBase
    ? `<span class="capture-step__marker capture-step__marker--start"><i data-lucide="map-pin"></i></span>`
    : `<span class="capture-step__marker"><i data-lucide="chevron-down"></i></span>`

  return `
    <li class="capture-step${step.isTarget ? ' capture-step--target' : ''}${step.isBase ? ' capture-step--base' : ''}">
      ${index > 0 ? marker : ''}
      <div class="capture-step__card${isCurrentModal ? ' current' : ''}"${clickable}>
        <img data-sprite-src="${p.sprites.officialArtwork ?? p.sprites.default ?? ''}" alt="${p.name}" />
        <div class="capture-step__info">
          <div class="capture-step__title-row">
            <span class="capture-step__id">${dexNumber(p.id)}</span>
            <span class="capture-step__name">${p.name}</span>
            ${step.isTarget ? `<span class="capture-step__target-badge"><i data-lucide="target"></i>${t.modal.capturePlanTargetBadge}</span>` : ''}
          </div>
          <div class="capture-step__types">${typeBadgesHtml(p.types, true)}</div>
          ${step.condition ? `<span class="capture-step__condition">${step.condition}</span>` : ''}
          ${step.isTrade ? `<span class="capture-step__trade-badge"><i data-lucide="refresh-cw"></i>${t.modal.capturePlanTradeBadge}</span>` : ''}
        </div>
      </div>
    </li>
  `
}

export function renderCapturePlanContent(ctx: RenderContext): string {
  const locale = getCurrentLocale()
  const t = getTranslations(locale)
  const steps = buildCaptureSteps(ctx.chain, ctx.pokemon.id, locale)

  if (steps.length === 0) {
    return `<div class="capture-plan">${renderAcquisitionCard(ctx.pokemon.name, ctx.baseAcquisitions, ctx.selectedGame, t)}</div>`
  }

  const baseNode = steps[0].node
  const baseName = ctx.allById.get(baseNode.speciesId)?.name ?? baseNode.speciesName
  const stepsHtml = steps.map((s, i) => renderStep(s, i, ctx, t)).join('')

  return `
    <div class="capture-plan">
      ${renderAcquisitionCard(baseName, ctx.baseAcquisitions, ctx.selectedGame, t)}
      <ol class="capture-plan__route">${stepsHtml}</ol>
    </div>
  `
}
