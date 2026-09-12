import {
  computeTeamDefense,
  computeTeamOffense,
  splitWeaknessesAndResistances,
  getTypeMultiplier,
  type AttackSource,
  type TeamDefenseEntry,
  type TeamMember,
  type TeamOffenseEntry,
  type TeamOffenseSummary,
} from "../typeChart";
import { getCurrentLocale, getMoveName, getTranslations, getTypeName, type Locale } from "../i18n/translations";
import { typeColor } from "../typeColors";
import { refreshIcons } from "../icons";
import { capitalize, formatMult } from "./helpers";
import type { TeamContext } from "./types";

export function getAttackSources(
  team = { slots: [] as any[] },
  pokemonById = new Map<number, any>(),
  moveDetailsMap: Record<string, any> = {},
  activeOffenseMode: "moves" | "stab" = "moves"
): AttackSource[] {
  const sources: AttackSource[] = [];

  for (let i = 0; i < team.slots.length; i++) {
    const slot = team.slots[i];
    if (!slot || slot.pokemonId === null) continue;
    const pokemon = pokemonById.get(slot.pokemonId);
    if (!pokemon) continue;

    if (activeOffenseMode === "moves") {
      let hasDamagingMove = false;
      if (slot.moves && slot.moves.length) {
        for (const moveName of slot.moves) {
          if (!moveName) continue;
          const meta = moveDetailsMap[moveName];
          if (meta && meta.category !== "status") {
            hasDamagingMove = true;
            sources.push({
              pokemonName: pokemon.name,
              type: meta.type,
              moveName,
            });
          }
        }
      }
      if (!hasDamagingMove) {
        for (const pType of pokemon.types) {
          sources.push({
            pokemonName: pokemon.name,
            type: pType,
          });
        }
      }
    } else {
      for (const pType of pokemon.types) {
        sources.push({
          pokemonName: pokemon.name,
          type: pType,
        });
      }
    }
  }

  return sources;
}

export function renderDefenseKPIs(
  weaknesses: TeamDefenseEntry[],
  resistances: TeamDefenseEntry[],
  immunities: TeamDefenseEntry[],
  defenseKpisEl: HTMLElement | null,
  locale: Locale = getCurrentLocale()
): void {
  if (!defenseKpisEl) return;
  const t = getTranslations(locale);

  const criticalCount = weaknesses.filter(
    (w) => w.threatLevel === "critical" || w.threatLevel === "exposed"
  ).length;
  const resistCount = resistances.length;
  const immuneCount = immunities.length;

  defenseKpisEl.innerHTML = `
    <div class="side-panel-kpi side-panel-kpi--critical" title="${t.strengthsWeaknesses.threatCritical}">
      <span class="side-panel-kpi__count">${criticalCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiCritical}</span>
    </div>
    <div class="side-panel-kpi side-panel-kpi--resist" title="${t.strengthsWeaknesses.resistances}">
      <span class="side-panel-kpi__count">${resistCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiResists}</span>
    </div>
    <div class="side-panel-kpi side-panel-kpi--immune" title="${t.strengthsWeaknesses.immunities}">
      <span class="side-panel-kpi__count">${immuneCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiImmunes}</span>
    </div>
  `;
}

export function renderDefenseMiniGrid(
  defense: TeamDefenseEntry[],
  defenseMiniGridEl: HTMLElement | null,
  typeChart: any,
  locale: Locale = getCurrentLocale()
): void {
  if (!defenseMiniGridEl || !typeChart) return;
  const allTypes = typeChart.types || Object.keys(typeChart.chart);
  const defenseMap = new Map<string, TeamDefenseEntry>(defense.map((d) => [d.type, d]));

  const chipsHtml = allTypes
    .map((type: string) => {
      const entry = defenseMap.get(type);
      let severityClass = "type-mini-chip--neutral";
      let multLabel = "1×";

      if (entry) {
        if (entry.threatLevel === "critical" || entry.threatLevel === "exposed") {
          severityClass = entry.threatLevel === "critical" ? "type-mini-chip--critical" : "type-mini-chip--exposed";
          const maxMult = Math.max(...entry.weakDetails.map((m) => m.multiplier), 2);
          multLabel = formatMult(maxMult);
        } else if (entry.threatLevel === "covered") {
          severityClass = "type-mini-chip--covered";
          multLabel = "2×";
        } else if (entry.immuneCount > 0) {
          severityClass = "type-mini-chip--immune";
          multLabel = "0×";
        } else if (entry.resistCount > 0) {
          severityClass = "type-mini-chip--safe";
          const minMult = Math.min(...entry.resistDetails.map((m) => m.multiplier), 0.5);
          multLabel = formatMult(minMult);
        }
      }

      return `
        <div class="type-mini-chip ${severityClass}" data-type="${type}" title="${getTypeName(type, locale)}: ${multLabel}">
          <span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>
          <span class="type-mini-chip__mult">${multLabel}</span>
        </div>
      `;
    })
    .join("");

  defenseMiniGridEl.innerHTML = chipsHtml;
}

export function renderOffenseKPIs(
  offense: TeamOffenseSummary,
  offenseKpisEl: HTMLElement | null,
  locale: Locale = getCurrentLocale()
): void {
  if (!offenseKpisEl) return;
  const t = getTranslations(locale);

  offenseKpisEl.innerHTML = `
    <div class="side-panel-kpi side-panel-kpi--covered" title="${t.strengthsWeaknesses.superEffectiveTypes}">
      <span class="side-panel-kpi__count">${offense.coveredCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiCovered}</span>
    </div>
    <div class="side-panel-kpi side-panel-kpi--blindspot" title="${t.strengthsWeaknesses.blindSpots}">
      <span class="side-panel-kpi__count">${offense.blindSpots.length}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiBlindSpots}</span>
    </div>
  `;
}

export function renderOffenseMiniGrid(
  offense: TeamOffenseSummary,
  offenseMiniGridEl: HTMLElement | null,
  typeChart: any,
  locale: Locale = getCurrentLocale()
): void {
  if (!offenseMiniGridEl || !typeChart) return;
  const t = getTranslations(locale);
  const allTypes = typeChart.types || Object.keys(typeChart.chart);
  const coveredSet = new Set(offense.coveredTypes.map((c: TeamOffenseEntry) => c.targetType));

  const chipsHtml = allTypes
    .map((type: string) => {
      const isCovered = coveredSet.has(type);
      const severityClass = isCovered ? "type-mini-chip--offense-covered" : "type-mini-chip--offense-blindspot";
      const multLabel = isCovered ? "2×" : "-";

      return `
        <div class="type-mini-chip ${severityClass}" data-type="${type}" title="${getTypeName(type, locale)}: ${isCovered ? "2×" : t.strengthsWeaknesses.blindSpots}">
          <span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>
          <span class="type-mini-chip__mult">${multLabel}</span>
        </div>
      `;
    })
    .join("");

  offenseMiniGridEl.innerHTML = chipsHtml;
}

export function renderWeaknessItemHTML(entry: TeamDefenseEntry, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);

  let threatBadge = "";
  if (entry.threatLevel === "critical") {
    threatBadge = `<span class="threat-pill threat-pill--critical"><i data-lucide="alert-triangle"></i> ${t.strengthsWeaknesses.threatCritical}</span>`;
  } else if (entry.threatLevel === "exposed") {
    threatBadge = `<span class="threat-pill threat-pill--exposed">${t.strengthsWeaknesses.threatExposed}</span>`;
  } else {
    threatBadge = `<span class="threat-pill threat-pill--covered">${t.strengthsWeaknesses.threatCovered}</span>`;
  }

  const has4x = entry.weakDetails.some((m) => m.multiplier >= 4);
  const countLabel =
    entry.weakCount === 1
      ? t.strengthsWeaknesses.weakLabel.replace("{n}", "1")
      : t.strengthsWeaknesses.weakLabelPlural.replace("{n}", String(entry.weakCount));
  const weakCountBadge = `<span class="threat-pill threat-pill--weak">${countLabel}${has4x ? " (4×)" : ""}</span>`;

  let supportBadge = "";
  if (entry.immuneCount > 0) {
    const immuneLabel =
      entry.immuneCount === 1
        ? t.strengthsWeaknesses.immuneLabel.replace("{n}", "1")
        : t.strengthsWeaknesses.immuneLabelPlural.replace("{n}", String(entry.immuneCount));
    supportBadge = `<span class="threat-pill threat-pill--immune">${immuneLabel}</span>`;
  } else if (entry.resistCount > 0) {
    const resistLabel =
      entry.resistCount === 1
        ? t.strengthsWeaknesses.resistLabel.replace("{n}", "1")
        : t.strengthsWeaknesses.resistLabelPlural.replace("{n}", String(entry.resistCount));
    supportBadge = `<span class="threat-pill threat-pill--resist">${resistLabel}</span>`;
  }

  const weakTags = entry.weakDetails
    .map((m) => {
      const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
      return `<span class="member-tag member-tag--weak">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">${formatMult(m.multiplier)}</span></span>`;
    })
    .join("");

  const safeTags = [
    ...entry.immuneDetails.map((m) => {
      const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
      return `<span class="member-tag member-tag--immune">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">0×</span></span>`;
    }),
    ...entry.resistDetails.map((m) => {
      const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
      return `<span class="member-tag member-tag--resist">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">${formatMult(m.multiplier)}</span></span>`;
    }),
  ].join("");

  return `
    <details class="defense-item defense-item--${entry.threatLevel}" data-defense-item name="sidepanel-breakdown" data-type="${entry.type}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.type}" style="--badge-bg:${typeColor(entry.type)}">
              ${getTypeName(entry.type, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          ${threatBadge}
          ${weakCountBadge}
          ${supportBadge}
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--weak">
            <i data-lucide="x"></i> ${t.strengthsWeaknesses.vulnerableGroup}
          </span>
          <div class="defense-item__tags">${weakTags}</div>
        </div>
        ${
          safeTags
            ? `
          <div class="defense-item__group">
            <span class="defense-item__group-title defense-item__group-title--safe">
              <i data-lucide="shield"></i> ${t.strengthsWeaknesses.resistantGroup}
            </span>
            <div class="defense-item__tags">${safeTags}</div>
          </div>
        `
            : `
          <div class="defense-item__notice defense-item__notice--warn">
            <i data-lucide="info"></i>
            <span>${t.strengthsWeaknesses.noResistWarning}</span>
          </div>
        `
        }
      </div>
    </details>
  `;
}

export function renderResistItemHTML(entry: TeamDefenseEntry, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);

  const resistLabel =
    entry.resistCount === 1
      ? t.strengthsWeaknesses.resistLabel.replace("{n}", "1")
      : t.strengthsWeaknesses.resistLabelPlural.replace("{n}", String(entry.resistCount));
  const hasQuarter = entry.resistDetails.some((m) => m.multiplier <= 0.25);
  const resistBadge = `<span class="threat-pill threat-pill--resist">${resistLabel}${hasQuarter ? " (¼×)" : ""}</span>`;

  const resistTags = entry.resistDetails
    .map((m) => {
      const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
      return `<span class="member-tag member-tag--resist">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">${formatMult(m.multiplier)}</span></span>`;
    })
    .join("");

  return `
    <details class="defense-item defense-item--safe" data-defense-item name="sidepanel-breakdown" data-type="${entry.type}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.type}" style="--badge-bg:${typeColor(entry.type)}">
              ${getTypeName(entry.type, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          ${resistBadge}
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--safe">
            <i data-lucide="shield"></i> ${t.strengthsWeaknesses.resistantGroup}
          </span>
          <div class="defense-item__tags">${resistTags}</div>
        </div>
      </div>
    </details>
  `;
}

export function renderImmunityItemHTML(entry: TeamDefenseEntry, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);

  const immuneLabel =
    entry.immuneCount === 1
      ? t.strengthsWeaknesses.immuneLabel.replace("{n}", "1")
      : t.strengthsWeaknesses.immuneLabelPlural.replace("{n}", String(entry.immuneCount));
  const immuneBadge = `<span class="threat-pill threat-pill--immune">${immuneLabel} (0×)</span>`;

  const immuneTags = entry.immuneDetails
    .map((m) => {
      const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
      return `<span class="member-tag member-tag--immune">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">0×</span></span>`;
    })
    .join("");

  return `
    <details class="defense-item defense-item--immune" data-defense-item name="sidepanel-breakdown" data-type="${entry.type}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.type}" style="--badge-bg:${typeColor(entry.type)}">
              ${getTypeName(entry.type, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          ${immuneBadge}
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--immune">
            <i data-lucide="shield-off"></i> ${t.strengthsWeaknesses.immuneGroup}
          </span>
          <div class="defense-item__tags">${immuneTags}</div>
        </div>
      </div>
    </details>
  `;
}

export function renderOffenseCoveredItemHTML(
  entry: TeamOffenseEntry,
  locale: Locale = getCurrentLocale(),
  moveDetailsMap: Record<string, any> = {}
): string {
  const t = getTranslations(locale);

  const countLabel =
    entry.attackers.length === 1
      ? t.strengthsWeaknesses.attackerCount.replace("{n}", "1")
      : t.strengthsWeaknesses.attackerCountPlural.replace("{n}", String(entry.attackers.length));

  const attackerTags = entry.attackers
    .map((att) => {
      const moveLabel = att.moveName ? ` (${getMoveName(att.moveName, locale, moveDetailsMap[att.moveName])})` : "";
      return `
        <span class="member-tag member-tag--attacker">
          ${capitalize(att.pokemonName)}${moveLabel} <span class="member-tag__mult">${formatMult(att.multiplier)}</span>
        </span>
      `;
    })
    .join("");

  return `
    <details class="defense-item defense-item--covered-offense" data-defense-item name="sidepanel-breakdown" data-type="${entry.targetType}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.targetType}" style="--badge-bg:${typeColor(entry.targetType)}">
              ${getTypeName(entry.targetType, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          <span class="threat-pill threat-pill--covered-offense">${countLabel}</span>
          <span class="threat-pill threat-pill--covered-offense">2×</span>
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--attacker">
            <i data-lucide="swords"></i> ${t.strengthsWeaknesses.superEffectiveTypes}:
          </span>
          <div class="defense-item__tags">${attackerTags}</div>
        </div>
      </div>
    </details>
  `;
}

export function renderOffenseBlindSpotItemHTML(entry: TeamOffenseEntry, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);

  return `
    <details class="defense-item defense-item--blindspot" data-defense-item name="sidepanel-breakdown" data-type="${entry.targetType}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.targetType}" style="--badge-bg:${typeColor(entry.targetType)}">
              ${getTypeName(entry.targetType, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          <span class="threat-pill threat-pill--blindspot">${t.strengthsWeaknesses.blindSpots}</span>
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__notice defense-item__notice--warn">
          <i data-lucide="info"></i>
          <span>${t.strengthsWeaknesses.blindSpotHint}</span>
        </div>
      </div>
    </details>
  `;
}

export function setupStrengthsPanel(context: TeamContext) {
  const sidePanelEl = document.querySelector<HTMLElement>("[data-strengths-panel]");
  const densitySwitchEl = document.querySelector<HTMLButtonElement>("[data-density-switch]");
  const panelEmptyEl = document.querySelector<HTMLElement>("[data-panel-empty]");
  const panelContentEl = document.querySelector<HTMLElement>("[data-panel-content]");
  const panelTabToggleEl = document.querySelector<HTMLElement>("[data-panel-tab-toggle]");
  const tabContentDefenseEl = document.querySelector<HTMLElement>("[data-tab-content-defense]");
  const tabContentOffenseEl = document.querySelector<HTMLElement>("[data-tab-content-offense]");

  const defenseKpisEl = document.querySelector<HTMLElement>("[data-defense-kpis]");
  const defenseMiniGridEl = document.querySelector<HTMLElement>("[data-defense-mini-grid]");
  const weaknessesListEl = document.querySelector<HTMLElement>("[data-weaknesses-list]");
  const resistancesListEl = document.querySelector<HTMLElement>("[data-resistances-list]");
  const immunitiesListEl = document.querySelector<HTMLElement>("[data-immunities-list]");
  const weaknessesCountEl = document.querySelector<HTMLElement>("[data-weaknesses-count]");
  const resistancesCountEl = document.querySelector<HTMLElement>("[data-resistances-count]");
  const immunitiesCountEl = document.querySelector<HTMLElement>("[data-immunities-count]");

  const offenseKpisEl = document.querySelector<HTMLElement>("[data-offense-kpis]");
  const offenseMiniGridEl = document.querySelector<HTMLElement>("[data-offense-mini-grid]");
  const offenseModeToggleEl = document.querySelector<HTMLElement>("[data-offense-mode-toggle]");
  const offensePctEl = document.querySelector<HTMLElement>("[data-offense-pct]");
  const offenseMeterEl = document.querySelector<HTMLElement>("[data-offense-meter]");
  const offenseScoreLabelEl = document.querySelector<HTMLElement>("[data-offense-score-label]");
  const offenseCoveredCountEl = document.querySelector<HTMLElement>("[data-offense-covered-count]");
  const offenseBlindspotsCountEl = document.querySelector<HTMLElement>("[data-offense-blindspots-count]");
  const offenseCoveredListEl = document.querySelector<HTMLElement>("[data-offense-covered-list]");
  const offenseBlindspotsListEl = document.querySelector<HTMLElement>("[data-offense-blindspots-list]");

  // Strengths Guide Modal
  const openPanelGuideBtns = document.querySelectorAll<HTMLButtonElement>("[data-open-panel-guide]");
  const strengthsGuideOverlay = document.querySelector<HTMLElement>("[data-strengths-guide-overlay]");
  const strengthsGuideCloseBtn = document.querySelector<HTMLButtonElement>("[data-strengths-guide-close]");
  const guideTabBtns = document.querySelectorAll<HTMLButtonElement>("[data-guide-tab]");
  const guidePanes = document.querySelectorAll<HTMLElement>("[data-guide-pane]");

  function updateDensityUI(): void {
    const activeDensity = context.getActiveDensity();
    if (sidePanelEl) {
      sidePanelEl.setAttribute("data-view-density", activeDensity);
    }
    if (densitySwitchEl) {
      const isCompact = activeDensity === "compact";
      densitySwitchEl.setAttribute("aria-checked", String(isCompact));
      const locale = context.getLocale();
      const t = getTranslations(locale);
      densitySwitchEl.title = isCompact ? t.strengthsWeaknesses.viewCompact : t.strengthsWeaknesses.viewDetailed;
    }
  }

  function setDensity(density: "compact" | "detailed"): void {
    context.setActiveDensity(density);
    try {
      localStorage.setItem("poketeam_view_density", density);
    } catch {}
    updateDensityUI();
  }

  function handleCrossHighlight(targetType: string | null): void {
    const slotCols = document.querySelectorAll<HTMLElement>(".team-slot-column");
    const typeChart = context.getTypeChart();
    if (!targetType || !typeChart) {
      slotCols.forEach((col) => {
        col.classList.remove(
          "is-dimmed",
          "is-highlighted-weak-4x",
          "is-highlighted-weak-2x",
          "is-highlighted-resist",
          "is-highlighted-immune",
          "is-highlighted-attacker"
        );
      });
      return;
    }

    const team = context.getTeam();
    const pokemonById = context.getPokemonById();
    const activePanelTab = context.getActivePanelTab();
    const activeOffenseMode = context.getActiveOffenseMode();
    const moveDetailsMap = context.getMoveDetailsMap();

    slotCols.forEach((col) => {
      const idx = Number(col.dataset.slotColumn);
      const slot = team.slots[idx];
      if (!slot || slot.pokemonId === null) {
        col.classList.add("is-dimmed");
        return;
      }
      const pokemon = pokemonById.get(slot.pokemonId);
      if (!pokemon) {
        col.classList.add("is-dimmed");
        return;
      }

      col.classList.remove(
        "is-dimmed",
        "is-highlighted-weak-4x",
        "is-highlighted-weak-2x",
        "is-highlighted-resist",
        "is-highlighted-immune",
        "is-highlighted-attacker"
      );

      if (activePanelTab === "defense") {
        const mult = getTypeMultiplier(typeChart, targetType, pokemon.types, {
          item: slot.item,
          speciesId: pokemon.id,
          ability: slot.ability,
        });
        if (mult >= 4) {
          col.classList.add("is-highlighted-weak-4x");
        } else if (mult >= 2) {
          col.classList.add("is-highlighted-weak-2x");
        } else if (mult === 0) {
          col.classList.add("is-highlighted-immune");
        } else if (mult <= 0.5) {
          col.classList.add("is-highlighted-resist");
        } else {
          col.classList.add("is-dimmed");
        }
      } else {
        let isAttacker = false;
        if (activeOffenseMode === "moves" && slot.moves?.length) {
          for (const mName of slot.moves) {
            if (!mName) continue;
            const meta = moveDetailsMap[mName];
            if (meta && meta.category !== "status") {
              const mMult = typeChart.chart[meta.type]?.[targetType] ?? 1;
              if (mMult >= 2) {
                isAttacker = true;
                break;
              }
            }
          }
        }
        if (!isAttacker) {
          for (const pType of pokemon.types) {
            const mMult = typeChart.chart[pType]?.[targetType] ?? 1;
            if (mMult >= 2) {
              isAttacker = true;
              break;
            }
          }
        }

        if (isAttacker) {
          col.classList.add("is-highlighted-attacker");
        } else {
          col.classList.add("is-dimmed");
        }
      }
    });
  }

  function renderOffensePanel(): void {
    const typeChart = context.getTypeChart();
    if (!typeChart || !tabContentOffenseEl) return;
    const locale = context.getLocale();
    const t = getTranslations(locale);

    const sources = getAttackSources(
      context.getTeam(),
      context.getPokemonById(),
      context.getMoveDetailsMap(),
      context.getActiveOffenseMode()
    );
    const offense = computeTeamOffense(typeChart, sources);

    renderOffenseKPIs(offense, offenseKpisEl, locale);
    renderOffenseMiniGrid(offense, offenseMiniGridEl, typeChart, locale);

    if (offensePctEl) {
      offensePctEl.textContent = `${offense.coveragePercentage}%`;
    }
    if (offenseMeterEl) {
      offenseMeterEl.style.width = `${offense.coveragePercentage}%`;
    }
    if (offenseScoreLabelEl) {
      offenseScoreLabelEl.textContent = t.strengthsWeaknesses.coverageScore
        .replace("{count}", String(offense.coveredCount))
        .replace("{total}", String(offense.totalTypes));
    }
    if (offenseCoveredCountEl) {
      offenseCoveredCountEl.textContent = offense.coveredCount ? `(${offense.coveredCount})` : "";
    }
    if (offenseBlindspotsCountEl) {
      offenseBlindspotsCountEl.textContent = offense.blindSpots.length ? `(${offense.blindSpots.length})` : "";
    }

    if (offenseCoveredListEl) {
      offenseCoveredListEl.innerHTML = offense.coveredTypes.length
        ? offense.coveredTypes.map((entry) => renderOffenseCoveredItemHTML(entry, locale, context.getMoveDetailsMap())).join("")
        : `<p class="side-panel__empty">${t.strengthsWeaknesses.noOffenseCovered}</p>`;
    }

    if (offenseBlindspotsListEl) {
      offenseBlindspotsListEl.innerHTML = offense.blindSpots.length
        ? offense.blindSpots.map((entry) => renderOffenseBlindSpotItemHTML(entry, locale)).join("")
        : `<p class="side-panel__empty">${t.strengthsWeaknesses.noBlindSpots}</p>`;
    }
  }

  function renderStrengthsPanel(): void {
    const locale = context.getLocale();
    const t = getTranslations(locale);
    const team = context.getTeam();
    const pokemonById = context.getPokemonById();
    const typeChart = context.getTypeChart();

    const activeMembers: TeamMember[] = team.slots
      .map((s): TeamMember | null => {
        if (s.pokemonId === null) return null;
        const p = pokemonById.get(s.pokemonId);
        if (!p) return null;
        return {
          name: p.name,
          types: p.types,
          speciesId: p.id,
          item: s.item ?? null,
          ability: s.ability ?? null,
        };
      })
      .filter((m): m is TeamMember => m !== null);

    if (!activeMembers.length || !typeChart) {
      if (panelEmptyEl) panelEmptyEl.hidden = false;
      if (panelContentEl) panelContentEl.hidden = true;
      return;
    }

    if (panelEmptyEl) panelEmptyEl.hidden = true;
    if (panelContentEl) panelContentEl.hidden = false;

    const defense = computeTeamDefense(typeChart, activeMembers);
    const { weaknesses, resistances, immunities } = splitWeaknessesAndResistances(defense);

    renderDefenseKPIs(weaknesses, resistances, immunities, defenseKpisEl, locale);
    renderDefenseMiniGrid(defense, defenseMiniGridEl, typeChart, locale);

    if (weaknessesCountEl) {
      weaknessesCountEl.textContent = weaknesses.length ? `(${weaknesses.length})` : "";
    }
    if (resistancesCountEl) {
      resistancesCountEl.textContent = resistances.length ? `(${resistances.length})` : "";
    }
    if (immunitiesCountEl) {
      immunitiesCountEl.textContent = immunities.length ? `(${immunities.length})` : "";
    }

    if (weaknessesListEl) {
      weaknessesListEl.innerHTML = weaknesses.length
        ? weaknesses.map((w) => renderWeaknessItemHTML(w, locale)).join("")
        : `<p class="side-panel__empty">${t.strengthsWeaknesses.noWeaknesses}</p>`;
    }

    if (resistancesListEl) {
      resistancesListEl.innerHTML = resistances.length
        ? resistances.map((r) => renderResistItemHTML(r, locale)).join("")
        : `<p class="side-panel__empty">${t.strengthsWeaknesses.noResistances}</p>`;
    }

    if (immunitiesListEl) {
      immunitiesListEl.innerHTML = immunities.length
        ? immunities.map((imm) => renderImmunityItemHTML(imm, locale)).join("")
        : `<p class="side-panel__empty">${t.strengthsWeaknesses.noImmunities}</p>`;
    }

    renderOffensePanel();
    context.renderSynergyPanel();
    refreshIcons();
  }

  // Event wiring
  panelTabToggleEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-panel-tab]");
    if (!btn) return;
    const tab = btn.dataset.panelTab as "defense" | "offense";
    if (!tab || tab === context.getActivePanelTab()) return;

    context.setActivePanelTab(tab);
    panelTabToggleEl.querySelectorAll<HTMLButtonElement>("[data-panel-tab]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.panelTab === tab));
    });

    if (tabContentDefenseEl) tabContentDefenseEl.hidden = tab !== "defense";
    if (tabContentOffenseEl) tabContentOffenseEl.hidden = tab !== "offense";
    handleCrossHighlight(null);
    refreshIcons();
  });

  densitySwitchEl?.addEventListener("click", () => {
    const current = context.getActiveDensity();
    const next = current === "compact" ? "detailed" : "compact";
    setDensity(next);
  });

  sidePanelEl?.addEventListener("mouseover", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-type]");
    if (target && target.dataset.type) {
      handleCrossHighlight(target.dataset.type);
    }
  });

  sidePanelEl?.addEventListener("mouseleave", () => {
    handleCrossHighlight(null);
  });

  offenseModeToggleEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-offense-mode]");
    if (!btn) return;
    const mode = btn.dataset.offenseMode as "moves" | "stab";
    if (!mode || mode === context.getActiveOffenseMode()) return;

    context.setActiveOffenseMode(mode);
    offenseModeToggleEl.querySelectorAll<HTMLButtonElement>("[data-offense-mode]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.offenseMode === mode));
    });

    renderOffensePanel();
    refreshIcons();
  });

  // Strengths Guide Modal
  function openStrengthsGuideModal(): void {
    if (!strengthsGuideOverlay) return;
    strengthsGuideOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    refreshIcons();
  }

  function closeStrengthsGuideModal(): void {
    if (!strengthsGuideOverlay) return;
    strengthsGuideOverlay.hidden = true;
    context.updateBodyScrollLock();
  }

  openPanelGuideBtns.forEach((btn) => btn.addEventListener("click", openStrengthsGuideModal));
  strengthsGuideCloseBtn?.addEventListener("click", closeStrengthsGuideModal);
  strengthsGuideOverlay?.addEventListener("click", (e) => {
    if (e.target === strengthsGuideOverlay) closeStrengthsGuideModal();
  });

  guideTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.guideTab;
      if (!tabName) return;

      guideTabBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });

      guidePanes.forEach((pane) => {
        pane.hidden = pane.dataset.guidePane !== tabName;
      });

      refreshIcons();
    });
  });

  return {
    renderStrengthsPanel,
    renderOffensePanel,
    updateDensityUI,
    setDensity,
    handleCrossHighlight,
    openStrengthsGuideModal,
    closeStrengthsGuideModal,
  };
}
