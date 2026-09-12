import { computeTeamSynergy } from "../teamSynergy";
import { getGameTitle, getTranslations, getTypeName } from "../i18n/translations";
import { typeColor } from "../typeColors";
import { refreshIcons } from "../icons";
import { toast } from "../toast";
import { getPokemonDetail } from "../pokemonDetail";
import { getDefaultAbility } from "../pokemonModal/utils";
import { setTeamSlot, setSelectedGame, setGameDexMode } from "../storage";
import { autoDetectGameFromTeam, capitalize, getGameOptionsHTML } from "./helpers";
import type { GameDexMode, Pokemon } from "../types";
import type { TeamContext } from "./types";

export function setupSynergyModal(context: TeamContext) {
  const openSynergyBtns = document.querySelectorAll<HTMLButtonElement>("[data-open-synergy]");
  const synergyModalOverlay = document.querySelector<HTMLElement>("[data-synergy-modal-overlay]");
  const synergyModalCloseBtn = document.querySelector<HTMLButtonElement>("[data-synergy-modal-close]");
  const synergyModalContent = document.querySelector<HTMLElement>("[data-synergy-panel-content]");
  const synergySidebarCalloutEl = document.querySelector<HTMLElement>("[data-synergy-sidebar-callout]");

  function renderSynergyPanel(): void {
    const typeChart = context.getTypeChart();
    const allPokemon = context.getAllPokemon();
    const pokemonById = context.getPokemonById();
    const team = context.getTeam();
    const pickerState = context.getPickerState();
    const gameSpeciesSets = context.getGameSpeciesSets();
    const gameDexData = context.getGameDexData();

    if (!typeChart || !synergyModalContent || !allPokemon.length) return;
    const locale = context.getLocale();
    const t = getTranslations(locale);

    type SynergyMember = Pokemon & { item?: string | null; ability?: string | null };
    const activePokemon: SynergyMember[] = team.slots
      .map((s): SynergyMember | null => {
        if (s.pokemonId === null) return null;
        const p = pokemonById.get(s.pokemonId);
        if (!p) return null;
        return { ...p, item: s.item ?? null, ability: s.ability ?? null };
      })
      .filter((p): p is SynergyMember => p !== null);

    if (!activePokemon.length) {
      if (synergySidebarCalloutEl) synergySidebarCalloutEl.hidden = true;
      synergyModalContent.innerHTML = `
        <p class="side-panel__empty" style="text-align: center; padding: 40px 20px;">
          <i data-lucide="info" style="margin-bottom: 8px;"></i><br />
          ${locale === "es" ? "Agregá al menos un Pokémon a tu equipo para analizar sinergias y ver recomendaciones inteligentes." : "Add at least one Pokémon to your team to analyze synergies and see smart recommendations."}
        </p>
      `;
      refreshIcons();
      return;
    }

    if (synergySidebarCalloutEl) synergySidebarCalloutEl.hidden = false;

    // If no game is selected yet, attempt auto-detect from the current team
    if (!pickerState.game) {
      const detected = autoDetectGameFromTeam(team, gameDexData, gameSpeciesSets);
      if (detected) {
        pickerState.game = detected;
        setSelectedGame(detected);
        const teamHeaderGameSelectEl = document.querySelector<HTMLSelectElement>("[data-team-header-game-select]");
        const pickerGameFilterEl = document.querySelector<HTMLSelectElement>("[data-picker-game-filter]");
        if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = detected;
        if (pickerGameFilterEl) pickerGameFilterEl.value = detected;
      }
    }

    const setObj = pickerState.game ? gameSpeciesSets.get(pickerState.game) : undefined;
    const currentSet = setObj
      ? pickerState.dexMode === "obtainable"
        ? setObj.obtainable
        : setObj.regional
      : undefined;

    const report = computeTeamSynergy(typeChart, activePokemon, allPokemon, { gameSpeciesSet: currentSet });
    const hasEmptySlot = team.slots.some((s) => s.pokemonId === null);

    // 1. Toolbar with Game Selector and Dex Mode Toggle
    let noticeHtml = "";
    if (pickerState.game && currentSet) {
      const gTitle = getGameTitle(pickerState.game, locale);
      const dexLabel = pickerState.dexMode === "obtainable" ? t.pokedex.obtainable : t.pokedex.regionalDex;
      noticeHtml = `
        <span class="synergy-filter-notice">
          <i data-lucide="circle-check"></i>
          <span>${t.strengthsWeaknesses.synergyGameFilteredNotice
            .replace("{game}", gTitle)
            .replace("{count}", String(currentSet.size))
            .replace("{dex}", dexLabel)}</span>
        </span>
      `;
    }

    const toolbarHtml = `
      <div class="synergy-modal-toolbar">
        <div class="synergy-modal-toolbar__group">
          <div class="select-wrapper select-wrapper--compact" style="min-width: 180px;">
            <i data-lucide="gamepad-2" class="select-wrapper__icon"></i>
            <select class="game-select" data-synergy-game-filter aria-label="${t.team.gameSection}">
              ${getGameOptionsHTML(context.getGenerations(), pickerState.game, locale)}
            </select>
            <i data-lucide="chevron-down" class="select-wrapper__arrow"></i>
          </div>

          ${
            pickerState.game
              ? `
            <div class="view-toggle view-toggle--compact" data-synergy-dex-mode-toggle>
              <button class="view-toggle__btn" type="button" data-synergy-dex-mode="regional" aria-pressed="${String(pickerState.dexMode === "regional")}">
                ${t.pokedex.regionalDex}
              </button>
              <button class="view-toggle__btn" type="button" data-synergy-dex-mode="obtainable" aria-pressed="${String(pickerState.dexMode === "obtainable")}">
                ${t.pokedex.obtainable}
              </button>
            </div>
          `
              : ""
          }
        </div>
        ${noticeHtml}
      </div>
    `;

    // 2. Overview Grid (Debilidades, Puntos ciegos, Tipos clave)
    const weaknessesToCover = [...report.criticalWeaknesses, ...report.exposedWeaknesses];
    const weaknessesHtml = weaknessesToCover.length
      ? weaknessesToCover
          .map(
            (ty) => `
          <span class="type-badge" data-type="${ty}" style="--badge-bg:${typeColor(ty)}">
            ${getTypeName(ty, locale)}
          </span>
        `
          )
          .join("")
      : `<span style="color: #86efac; font-size: 13px; font-weight: 500;">✓ ${locale === "es" ? "Sin debilidades desprotegidas" : "No unprotected weaknesses"}</span>`;

    const blindSpotsHtml = report.blindSpots.length
      ? report.blindSpots
          .map(
            (ty) => `
          <span class="type-badge" data-type="${ty}" style="--badge-bg:${typeColor(ty)}">
            ${getTypeName(ty, locale)}
          </span>
        `
          )
          .join("")
      : `<span style="color: #86efac; font-size: 13px; font-weight: 500;">✓ ${locale === "es" ? "Cobertura ofensiva completa" : "Full offensive coverage"}</span>`;

    const recommendedTypesHtml = report.recommendedTypes.length
      ? report.recommendedTypes
          .map((rt) => {
            const tooltipParts: string[] = [];
            if (rt.resistsTeamWeaknesses.length) {
              tooltipParts.push(
                (locale === "es" ? "Resiste: " : "Resists: ") +
                  rt.resistsTeamWeaknesses.map((w) => getTypeName(w, locale)).join(", ")
              );
            }
            if (rt.coversBlindSpots.length) {
              tooltipParts.push(
                (locale === "es" ? "Cubre: " : "Covers: ") +
                  rt.coversBlindSpots.map((b) => getTypeName(b, locale)).join(", ")
              );
            }
            return `
              <span class="type-badge" data-type="${rt.type}" style="--badge-bg:${typeColor(rt.type)}" title="${tooltipParts.join(" | ")}">
                ${getTypeName(rt.type, locale)}
              </span>
            `;
          })
          .join("")
      : `<span style="color: var(--text-muted); font-size: 13px;">-</span>`;

    const overviewHtml = `
      <div class="synergy-overview-grid">
        <div class="synergy-overview-card">
          <div class="synergy-overview-card__title">
            <i data-lucide="shield-alert"></i>
            <span>${locale === "es" ? "Debilidades a mitigar" : "Weaknesses to mitigate"}</span>
          </div>
          <div class="synergy-overview-card__types">${weaknessesHtml}</div>
        </div>

        <div class="synergy-overview-card">
          <div class="synergy-overview-card__title">
            <i data-lucide="circle-dot"></i>
            <span>${locale === "es" ? "Puntos ciegos ofensivos" : "Offensive blind spots"}</span>
          </div>
          <div class="synergy-overview-card__types">${blindSpotsHtml}</div>
        </div>

        <div class="synergy-overview-card">
          <div class="synergy-overview-card__title">
            <i data-lucide="sparkles"></i>
            <span>${locale === "es" ? "Tipos elementales clave" : "Key recommended types"}</span>
          </div>
          <div class="synergy-overview-card__types">${recommendedTypesHtml}</div>
        </div>
      </div>
    `;

    // 3. Suggested Pokémon cards in spacious grid
    let pokemonCardsHtml = "";
    if (report.suggestions.length) {
      const cards = report.suggestions
        .map((sug) => {
          const p = sug.pokemon;
          const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? "";
          const typesBadges = p.types
            .map(
              (ty) => `
            <span class="type-badge type-badge--sm" data-type="${ty}" style="--badge-bg:${typeColor(ty)}">
              ${getTypeName(ty, locale)}
            </span>
          `
            )
            .join("");

          const reasonTags: string[] = [];

          if (sug.keyImmunities.length) {
            const immStr = sug.keyImmunities.map((ty) => getTypeName(ty, locale)).join(", ");
            reasonTags.push(
              `<span class="synergy-tag synergy-tag--immune"><i data-lucide="shield-check"></i> ${t.strengthsWeaknesses.immuneToVulnerability.replace("{types}", immStr)}</span>`
            );
          }

          if (sug.keyResistances.length) {
            const resStr = sug.keyResistances.map((ty) => getTypeName(ty, locale)).join(", ");
            reasonTags.push(
              `<span class="synergy-tag synergy-tag--resist"><i data-lucide="shield"></i> ${t.strengthsWeaknesses.resistsVulnerability.replace("{types}", resStr)}</span>`
            );
          }

          if (sug.coveredBlindSpots.length) {
            const covStr = sug.coveredBlindSpots.map((ty) => getTypeName(ty, locale)).join(", ");
            reasonTags.push(
              `<span class="synergy-tag synergy-tag--offense"><i data-lucide="swords"></i> ${t.strengthsWeaknesses.coversBlindSpotBadge.replace("{types}", covStr)}</span>`
            );
          }

          if (sug.newTypes.length) {
            const newStr = sug.newTypes.map((ty) => getTypeName(ty, locale)).join(", ");
            reasonTags.push(
              `<span class="synergy-tag synergy-tag--new"><i data-lucide="sparkles"></i> ${t.strengthsWeaknesses.bringsNewTypeBadge.replace("{types}", newStr)}</span>`
            );
          }

          const actionBtn = hasEmptySlot
            ? `
              <button class="btn btn--sm btn--primary" type="button" data-synergy-add="${p.id}">
                <i data-lucide="plus"></i> <span>${t.strengthsWeaknesses.addToTeam}</span>
              </button>
            `
            : `
              <button class="btn btn--sm btn--subtle" type="button" disabled title="${t.strengthsWeaknesses.teamFull.replace("{max}", String(team.size))}">
                <i data-lucide="check"></i> <span>${team.size}/${team.size}</span>
              </button>
            `;

          return `
            <div class="synergy-card">
              <div class="synergy-card__header">
                <div class="synergy-card__info">
                  <img class="synergy-card__sprite" src="${sprite}" alt="${p.name}" loading="lazy" />
                  <div class="synergy-card__meta">
                    <span class="synergy-card__name">${capitalize(p.name)}</span>
                    <div class="synergy-card__types">${typesBadges}</div>
                  </div>
                </div>
                ${actionBtn}
              </div>
              <div class="synergy-card__reasons">
                ${reasonTags.join("")}
              </div>
            </div>
          `;
        })
        .join("");

      pokemonCardsHtml = `
        <div class="synergy-pokemon-section">
          <span class="defense-group__label" style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">
            ${t.strengthsWeaknesses.suggestedPokemonTitle} (${report.suggestions.length})
          </span>
          <div class="synergy-grid">${cards}</div>
        </div>
      `;
    } else {
      pokemonCardsHtml = `
        <p class="side-panel__empty" style="text-align: center; padding: 30px;">${t.strengthsWeaknesses.synergyNoSuggestions}</p>
      `;
    }

    synergyModalContent.innerHTML = `
      ${toolbarHtml}
      ${overviewHtml}
      ${pokemonCardsHtml}
    `;

    // Wire toolbar listeners inside modal
    const synergyGameSelect = synergyModalContent.querySelector<HTMLSelectElement>("[data-synergy-game-filter]");
    synergyGameSelect?.addEventListener("change", () => {
      pickerState.game = synergyGameSelect.value;
      setSelectedGame(pickerState.game);
      const pickerGameFilterEl = document.querySelector<HTMLSelectElement>("[data-picker-game-filter]");
      const teamHeaderGameSelectEl = document.querySelector<HTMLSelectElement>("[data-team-header-game-select]");
      if (pickerGameFilterEl) pickerGameFilterEl.value = pickerState.game;
      if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = pickerState.game;
      renderSynergyPanel();
      refreshIcons();
    });

    const synergyDexToggle = synergyModalContent.querySelector<HTMLElement>("[data-synergy-dex-mode-toggle]");
    synergyDexToggle?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-synergy-dex-mode]");
      if (!btn) return;
      const mode = btn.dataset.synergyDexMode as GameDexMode;
      if (mode && mode !== pickerState.dexMode) {
        pickerState.dexMode = mode;
        setGameDexMode(mode);
        renderSynergyPanel();
        refreshIcons();
      }
    });

    refreshIcons();
  }

  function openSynergyModal(): void {
    if (!synergyModalOverlay || !synergyModalContent) return;
    renderSynergyPanel();
    synergyModalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    refreshIcons();
  }

  function closeSynergyModal(): void {
    if (!synergyModalOverlay) return;
    synergyModalOverlay.hidden = true;
    context.updateBodyScrollLock();
  }

  openSynergyBtns.forEach((btn) => btn.addEventListener("click", openSynergyModal));
  synergyModalCloseBtn?.addEventListener("click", closeSynergyModal);
  synergyModalOverlay?.addEventListener("click", (e) => {
    if (e.target === synergyModalOverlay) closeSynergyModal();
  });

  synergyModalContent?.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-synergy-add]");
    if (!btn) return;
    const pId = Number(btn.dataset.synergyAdd);
    const pokemon = context.getPokemonById().get(pId);
    if (!pokemon) return;

    const team = context.getTeam();
    const emptySlotIndex = team.slots.findIndex((s) => s.pokemonId === null);
    const locale = context.getLocale();
    const t = getTranslations(locale);

    if (emptySlotIndex === -1) {
      toast.info(t.strengthsWeaknesses.teamFull.replace("{max}", String(team.size)));
      return;
    }

    const detail = await getPokemonDetail(pId).catch(() => null);
    const baseStats = detail ? { ...detail.stats } : {};
    const defaultAbility = getDefaultAbility(detail);

    const nextTeam = setTeamSlot(emptySlotIndex, pId, baseStats, null, defaultAbility);
    context.setTeam(nextTeam);
    context.renderSingleSlot(emptySlotIndex);
    context.renderStrengthsPanel();
    context.renderTypeMatrix();
    renderSynergyPanel();
    toast.success(t.strengthsWeaknesses.teamAddedSuccess.replace("{name}", capitalize(pokemon.name)));
  });

  return {
    renderSynergyPanel,
    openSynergyModal,
    closeSynergyModal,
    isOverlayOpen: () => Boolean(synergyModalOverlay && !synergyModalOverlay.hidden),
  };
}
