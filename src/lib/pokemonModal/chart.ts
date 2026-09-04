import type { Nature, PokemonStats } from "../types";
import { getCurrentLocale, getTranslations, type Locale } from "../i18n/translations";
import { typeColor } from "../typeColors";
import { NATURE_STAT_DISPLAY } from "./constants";
import { getModalElements } from "./dom";
import { getCurrentEffectiveOverrides } from "./overrides";
import { modalState } from "./state";

export function getNatureModifier(nature: Nature | null, key: keyof PokemonStats): "up" | "down" | null {
  if (!nature || !nature.increasedStat || !nature.decreasedStat || nature.increasedStat === nature.decreasedStat) return null;
  const map: Record<string, keyof PokemonStats> = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "specialAttack",
    "special-defense": "specialDefense",
    speed: "speed",
  };
  if (map[nature.increasedStat] === key) return "up";
  if (map[nature.decreasedStat] === key) return "down";
  return null;
}

export function natureEffectText(nature: Nature | null, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);
  if (!nature) return locale === "es" ? "Elegí una naturaleza para ver su efecto." : "Choose a nature to see its effect.";
  if (!nature.increasedStat || !nature.decreasedStat) return t.modal.neutralNature;
  const statMap = NATURE_STAT_DISPLAY[locale] ?? NATURE_STAT_DISPLAY.en;
  const up = statMap[nature.increasedStat] ?? nature.increasedStat;
  const down = statMap[nature.decreasedStat] ?? nature.decreasedStat;
  if (locale === "es") {
    return `Sube ${up} y baja ${down}.`;
  }
  return `Increases ${up} and decreases ${down}.`;
}

export function renderNatureEffectBadges(nature: Nature | null, locale: Locale = getCurrentLocale()): string {
  if (!nature) return `<span class="detail-nature-hint">${locale === "es" ? "Elegí una naturaleza para ver su efecto." : "Choose a nature to see its effect."}</span>`;
  if (!nature.increasedStat || !nature.decreasedStat || nature.increasedStat === nature.decreasedStat) {
    return `<span class="detail-nature-tag detail-nature-tag--neutral">${locale === "es" ? "Naturaleza neutra (sin cambios)" : "Neutral nature (no changes)"}</span>`;
  }
  const statMap = NATURE_STAT_DISPLAY[locale] ?? NATURE_STAT_DISPLAY.en;
  const upLabel = statMap[nature.increasedStat] ?? nature.increasedStat;
  const downLabel = statMap[nature.decreasedStat] ?? nature.decreasedStat;
  return `
    <span class="detail-nature-tag detail-nature-tag--up">+10% ${upLabel}</span>
    <span class="detail-nature-tag detail-nature-tag--down">-10% ${downLabel}</span>
  `;
}

export function isStatUp(nature: Nature | null, key: keyof PokemonStats): boolean {
  return getNatureModifier(nature, key) === "up";
}

export function isStatDown(nature: Nature | null, key: keyof PokemonStats): boolean {
  return getNatureModifier(nature, key) === "down";
}

export function renderHexagonChart(stats: PokemonStats, primaryTypeColor: string, nature: Nature | null = null): string {
  const width = 250;
  const height = 165;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 50;
  const MAX_STAT = 255;

  const statList: { key: keyof PokemonStats; label: string }[] = [
    { key: "hp", label: "HP" },
    { key: "attack", label: "ATK" },
    { key: "defense", label: "DEF" },
    { key: "speed", label: "SPE" },
    { key: "specialDefense", label: "SPD" },
    { key: "specialAttack", label: "SPA" },
  ];

  const angles = statList.map((_, i) => -Math.PI / 2 + (i * Math.PI) / 3);

  function getGridPoints(rRatio: number): string {
    return angles
      .map((angle) => {
        const x = cx + radius * rRatio * Math.cos(angle);
        const y = cy + radius * rRatio * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  const valuePoints = statList
    .map((item, i) => {
      const val = Math.min(stats[item.key] ?? 0, MAX_STAT);
      const ratio = Math.max(val / MAX_STAT, 0.08);
      const x = cx + radius * ratio * Math.cos(angles[i]);
      const y = cy + radius * ratio * Math.sin(angles[i]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const axisLinesHtml = angles
    .map((angle) => {
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);
      return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="3,3" />`;
    })
    .join("");

  const labelsHtml = statList
    .map((item, i) => {
      const val = stats[item.key] ?? 0;
      const up = isStatUp(nature, item.key);
      const down = isStatDown(nature, item.key);
      const labelRadius = radius + 17;
      const lx = cx + labelRadius * Math.cos(angles[i]);
      const ly = cy + labelRadius * Math.sin(angles[i]);
      const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";

      let symbol = "";
      let symbolColor = "";
      if (up) {
        symbol = "▲";
        symbolColor = "#f87171";
      } else if (down) {
        symbol = "▼";
        symbolColor = "#60a5fa";
      }

      const valColor = up ? "#f87171" : down ? "#60a5fa" : val >= 130 ? "var(--accent)" : "var(--text)";

      return `
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" class="hexagon-chart__label">
          <tspan class="hexagon-chart__label-title">${item.label}</tspan>
          <tspan class="hexagon-chart__label-val" fill="${valColor}" dx="2">${val}</tspan>
          ${symbol ? `<tspan fill="${symbolColor}" dx="2" font-size="10px" font-weight="900">${symbol}</tspan>` : ""}
        </text>
      `;
    })
    .join("");

  const cleanColor = primaryTypeColor.replace("#", "");

  return `
    <div class="hexagon-chart-container">
      <svg class="hexagon-chart-svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto">
        <defs>
          <linearGradient id="hexGrad-${cleanColor}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primaryTypeColor}" stop-opacity="0.4" />
            <stop offset="100%" stop-color="${primaryTypeColor}" stop-opacity="0.12" />
          </linearGradient>
          <filter id="hexGlow-${cleanColor}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="${primaryTypeColor}" flood-opacity="0.4" />
          </filter>
        </defs>

        <polygon points="${getGridPoints(1)}" fill="var(--bg-elevated)" fill-opacity="0.2" stroke="var(--border-strong)" stroke-width="1.2" />
        <polygon points="${getGridPoints(0.75)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3" />
        <polygon points="${getGridPoints(0.5)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3" />
        <polygon points="${getGridPoints(0.25)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3" />

        ${axisLinesHtml}

        <polygon points="${valuePoints}" fill="url(#hexGrad-${cleanColor})" stroke="${primaryTypeColor}" stroke-width="2" filter="url(#hexGlow-${cleanColor})" class="hexagon-chart__polygon" />

        ${statList
          .map((item, i) => {
            const val = Math.min(stats[item.key] ?? 0, MAX_STAT);
            const ratio = Math.max(val / MAX_STAT, 0.08);
            const vx = cx + radius * ratio * Math.cos(angles[i]);
            const vy = cy + radius * ratio * Math.sin(angles[i]);
            return `<circle cx="${vx.toFixed(1)}" cy="${vy.toFixed(1)}" r="2" fill="${primaryTypeColor}" stroke="#ffffff" stroke-width="1" />`;
          })
          .join("")}

        ${labelsHtml}
      </svg>
    </div>
  `;
}

export function updateHexagonChartIfVisible(): void {
  if (!modalState.showHexagonChart || modalState.currentId === null || !modalState.lastContext) return;
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;
  const hexView = bodyEl.querySelector<HTMLElement>("[data-stats-hexagon-view]");
  if (!hexView) return;

  const overrides = getCurrentEffectiveOverrides();
  const userStats = overrides.stats ?? {};
  const currentStats: PokemonStats = {
    hp: userStats.hp ?? modalState.lastContext.detail.stats.hp,
    attack: userStats.attack ?? modalState.lastContext.detail.stats.attack,
    defense: userStats.defense ?? modalState.lastContext.detail.stats.defense,
    specialAttack: userStats.specialAttack ?? modalState.lastContext.detail.stats.specialAttack,
    specialDefense: userStats.specialDefense ?? modalState.lastContext.detail.stats.specialDefense,
    speed: userStats.speed ?? modalState.lastContext.detail.stats.speed,
  };
  const selectedNature = (modalState.lastContext.natures ?? []).find((n) => n.name === overrides.nature) ?? null;
  const primaryTypeColor = typeColor(modalState.lastContext.pokemon.types[0] ?? "normal");

  hexView.innerHTML = renderHexagonChart(currentStats, primaryTypeColor, selectedNature);
}
