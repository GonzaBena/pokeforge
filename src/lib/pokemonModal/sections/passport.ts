import { CAPTURE_METHOD_NAMES, getCurrentLocale, getTranslations } from '../../i18n/translations'
import { getCaptureMeta, getCapturedByGame, isCaptured } from '../../storage'
import type { CaptureMethod } from '../../types'
import type { RenderContext } from '../types'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function renderPassportContent(ctx: RenderContext): string {
  const locale = getCurrentLocale()
  const t = getTranslations(locale)
  const id = ctx.pokemon.id

  if (!isCaptured(id)) {
    return `<p class="detail-hint">${t.modal.passportEmptyHint}</p>`
  }

  const meta = getCaptureMeta(id)
  const dateValue = meta?.date ?? todayISO()
  const method = meta?.method ?? 'other'
  const methodOptionsHtml = (Object.keys(CAPTURE_METHOD_NAMES) as CaptureMethod[])
    .map(
      (m) =>
        `<option value="${m}" ${method === m ? 'selected' : ''}>${CAPTURE_METHOD_NAMES[m][locale]}</option>`,
    )
    .join('')

  const entry = ctx.selectedGame ? ctx.gameDexData?.[ctx.selectedGame] : null
  const isDualVersion = Boolean(
    entry?.versions &&
      entry.versions.length === 2 &&
      entry.exclusives &&
      Object.keys(entry.exclusives).length > 0,
  )

  const unspecifiedLabel = locale === 'es' ? 'Sin especificar' : 'Unspecified'

  let gameFieldHtml: string
  if (isDualVersion && entry?.versions) {
    const [vA, vB] = entry.versions
    const names = [
      getCapturedByGame(vA.id).has(id) ? (locale === 'es' ? vA.nameEs : vA.name) : null,
      getCapturedByGame(vB.id).has(id) ? (locale === 'es' ? vB.nameEs : vB.name) : null,
    ].filter((n): n is string => Boolean(n))

    gameFieldHtml = `
      <div class="detail-passport__field">
        <span class="detail-passport__label">${t.modal.passportGameLabel}</span>
        <span class="detail-passport__value">${names.join(' / ') || unspecifiedLabel}</span>
      </div>
    `
  } else {
    const versionOptions = entry?.versions
      ? entry.versions
          .map(
            (v) =>
              `<option value="${v.id}" ${meta?.game === v.id ? 'selected' : ''}>${locale === 'es' ? v.nameEs : v.name}</option>`,
          )
          .join('')
      : ''
    gameFieldHtml = `
      <label class="detail-passport__field">
        <span class="detail-passport__label">${t.modal.passportGameLabel}</span>
        <select data-passport-game>
          <option value="">${unspecifiedLabel}</option>
          ${versionOptions}
        </select>
      </label>
    `
  }

  const summaryHtml = meta
    ? `
      <div class="detail-passport__summary">
        <p>${t.modal.passportSummary
          .replace('{date}', meta.date)
          .replace('{method}', CAPTURE_METHOD_NAMES[meta.method][locale])
          .replace('{game}', meta.game ?? unspecifiedLabel)}</p>
        <button type="button" class="btn btn--compact btn--outline" data-passport-clear>${t.modal.passportClear}</button>
      </div>
    `
    : ''

  return `
    <div class="detail-passport">
      <div class="detail-passport__form">
        <label class="detail-passport__field">
          <span class="detail-passport__label">${t.modal.passportDateLabel}</span>
          <input type="date" data-passport-date value="${dateValue}" />
        </label>
        <label class="detail-passport__field">
          <span class="detail-passport__label">${t.modal.passportMethodLabel}</span>
          <select data-passport-method>${methodOptionsHtml}</select>
        </label>
        ${gameFieldHtml}
        <button type="button" class="btn btn--primary btn--compact" data-passport-save>${t.modal.passportSave}</button>
      </div>
      ${summaryHtml}
    </div>
  `
}
