import { getTranslations, getTypeName } from "../../i18n/translations";
import { typeColor } from "../../typeColors";
import { refreshIcons } from "../../icons";
import { toast } from "../../toast";
import { getPokemonDetail } from "../../pokemonDetail";
import { getDefaultAbility } from "../../pokemonModal/utils";
import { getGameDexMode, getSelectedGame, setGameDexMode, setSelectedGame, setTeamSlot } from "../../storage";
import type { GameDexMode, Pokemon } from "../../types";
import { capitalize, dexNumber, filterPokemonList, formatLabel, getGameOptionsHTML, getPickerExclusiveMap, renderEmptyState } from "../helpers";
import type { TeamContext } from "../types";

export function setupPokemonPicker(context: TeamContext) {
  const overlayEl = document.querySelector<HTMLElement>("[data-picker-overlay]")!;
  const pickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-picker-close]")!;
  const pickerBodyEl = document.querySelector<HTMLElement>("[data-picker-body]");
  const pickerResultsEl = document.querySelector<HTMLElement>("[data-picker-results]")!;
  const pickerSearchEl = document.querySelector<HTMLInputElement>("[data-picker-search]")!;
  const pickerTypeFilterEl = document.querySelector<HTMLElement>("[data-picker-type-filter]")!;
  const pickerTypeModeToggleEl = document.querySelector<HTMLElement>("[data-picker-type-mode-toggle]");
  const pickerGenFilterEl = document.querySelector<HTMLElement>("[data-picker-generation-filter]")!;
  const pickerGameFilterEl = document.querySelector<HTMLSelectElement>("[data-picker-game-filter]");
  const teamHeaderGameSelectEl = document.querySelector<HTMLSelectElement>("[data-team-header-game-select]");
  const pickerGameModeToggleEl = document.querySelector<HTMLElement>("[data-picker-game-mode-toggle]");
  const pickerExclusiveToggleEl = document.querySelector<HTMLElement>("[data-picker-exclusive-toggle]");
  const pickerMoveFilterEl = document.querySelector<HTMLInputElement>("[data-picker-move-filter]")!;
  const pickerMoveOptionsEl = document.querySelector<HTMLElement>("[data-picker-move-options]")!;

  const pickerState = context.getPickerState();
  let activeSlotIndex: number | null = null;
  let currentPickerResults: Pokemon[] = [];

  function updatePickerExclusiveToggleUI(): void {
    if (!pickerExclusiveToggleEl) return;
    const gameDexData = context.getGameDexData();
    const entry = pickerState.game && gameDexData ? gameDexData[pickerState.game] : null;
    const hasExclusives = Boolean(entry?.versions && entry.versions.length === 2 && entry.exclusives && Object.keys(entry.exclusives).length > 0);

    if (!hasExclusives) {
      pickerExclusiveToggleEl.hidden = true;
      pickerExclusiveToggleEl.innerHTML = "";
      pickerState.exclusive = new Set(["all"]);
      return;
    }

    pickerExclusiveToggleEl.hidden = false;
    const locale = context.getLocale();
    const t = getTranslations(locale);
    const [vA, vB] = entry!.versions!;
    const nameA = locale === "es" ? vA.nameEs : vA.name;
    const nameB = locale === "es" ? vB.nameEs : vB.name;

    pickerExclusiveToggleEl.innerHTML = `
      <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="all" aria-pressed="${String(pickerState.exclusive.has("all"))}">
        ${t.pokedex.exclusiveAll}
      </button>
      <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="${vA.id}" aria-pressed="${String(pickerState.exclusive.has(vA.id))}" style="--btn-color:${vA.color};">
        <span class="exclusive-dot" style="--btn-color:${vA.color};"></span>
        ${t.pokedex.exclusiveOnly.replace("{version}", nameA)}
      </button>
      <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="${vB.id}" aria-pressed="${String(pickerState.exclusive.has(vB.id))}" style="--btn-color:${vB.color};">
        <span class="exclusive-dot" style="--btn-color:${vB.color};"></span>
        ${t.pokedex.exclusiveOnly.replace("{version}", nameB)}
      </button>
      <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="both" aria-pressed="${String(pickerState.exclusive.has("both"))}">
        ${t.pokedex.exclusiveBoth}
      </button>
    `;
  }

  function updatePickerGameModeToggleUI(): void {
    if (!pickerGameModeToggleEl) return;
    if (!pickerState.game) {
      pickerGameModeToggleEl.hidden = true;
      return;
    }
    pickerGameModeToggleEl.hidden = false;
    pickerGameModeToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-game-mode]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.pickerGameMode === pickerState.dexMode));
    });
  }

  function renderPickerBatch(append = false): void {
    const locale = context.getLocale();
    const t = getTranslations(locale);
    const exclusivesMap = getPickerExclusiveMap(pickerState.game, context.getGameDexData());

    if (!currentPickerResults.length) {
      pickerResultsEl.innerHTML = renderEmptyState({
        icon: "search-x",
        title: locale === "es" ? "No se encontraron Pokémon" : "No Pokémon found",
        description:
          locale === "es"
            ? "No hay Pokémon que coincidan con la búsqueda o los filtros seleccionados."
            : "No Pokémon match the search or selected filters.",
        actionText: locale === "es" ? "Restablecer filtros" : "Reset filters",
        actionAttr: "data-clear-pokemon-filters",
      });
      refreshIcons();
      return;
    }

    const start = append ? pickerResultsEl.querySelectorAll(".picker-item").length : 0;
    const batch = currentPickerResults.slice(start, start + 60);
    if (!batch.length) return;

    const html = batch
      .map((p) => {
        let dotHtml = "";
        if (exclusivesMap.has(p.id)) {
          const meta = exclusivesMap.get(p.id)!;
          const vName = locale === "es" ? meta.nameEs : meta.name;
          const badgeTitle = t.pokedex.exclusiveBadge.replace("{version}", vName);
          dotHtml = `<span class="picker-item__exclusive-dot" style="--version-color:${meta.color};" title="${badgeTitle}"></span>`;
        }
        return `
          <button class="picker-item" type="button" data-picker-pick data-pokemon-id="${p.id}">
            <span class="picker-item__id">${dexNumber(p.id)}</span>
            <img src="${p.sprites.officialArtwork ?? p.sprites.default ?? ""}" alt="${p.name}" loading="lazy" />
            <span class="picker-item__name">${p.name}${dotHtml}</span>
          </button>
        `;
      })
      .join("");

    if (append) {
      pickerResultsEl.insertAdjacentHTML("beforeend", html);
    } else {
      pickerResultsEl.innerHTML = html;
    }
  }

  function renderPickerResults(): void {
    const gameSpeciesSets = context.getGameSpeciesSets();
    const gameSpeciesSet =
      pickerState.game && gameSpeciesSets.has(pickerState.game)
        ? pickerState.dexMode === "obtainable"
          ? gameSpeciesSets.get(pickerState.game)!.obtainable
          : gameSpeciesSets.get(pickerState.game)!.regional
        : null;

    const exclusivesMap = getPickerExclusiveMap(pickerState.game, context.getGameDexData());

    currentPickerResults = filterPokemonList(context.getAllPokemon(), {
      search: pickerState.search,
      types: pickerState.types,
      typeMode: pickerState.typeMode,
      generations: pickerState.generations,
      move: pickerState.move,
      gameSpeciesSet,
      exclusivesMap,
      exclusiveFilter: pickerState.exclusive,
    });

    const countEl = overlayEl.querySelector<HTMLElement>("[data-picker-count]");
    if (countEl) {
      countEl.textContent = `${currentPickerResults.length} Pokémon`;
    }
    if (pickerBodyEl) {
      pickerBodyEl.scrollTop = 0;
    } else {
      pickerResultsEl.scrollTop = 0;
    }
    renderPickerBatch(false);
  }

  const pickerScrollTarget = pickerBodyEl ?? pickerResultsEl;
  pickerScrollTarget.addEventListener(
    "scroll",
    () => {
      if (pickerScrollTarget.scrollTop + pickerScrollTarget.clientHeight >= pickerScrollTarget.scrollHeight - 300) {
        renderPickerBatch(true);
      }
    },
    { passive: true }
  );

  function openPokemonPicker(index: number): void {
    activeSlotIndex = index;
    overlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    pickerState.search = "";
    pickerState.types.clear();
    pickerState.typeMode = "or";
    pickerState.generations.clear();
    pickerState.move = "";
    pickerState.game = getSelectedGame();
    pickerState.dexMode = getGameDexMode();
    pickerState.exclusive = new Set(["all"]);
    pickerSearchEl.value = "";
    pickerMoveFilterEl.value = "";
    if (pickerGameFilterEl) pickerGameFilterEl.value = pickerState.game;
    updatePickerGameModeToggleUI();
    updatePickerExclusiveToggleUI();
    pickerTypeFilterEl.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    pickerTypeModeToggleEl?.querySelectorAll<HTMLButtonElement>("[data-picker-type-mode]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.pickerTypeMode === "or"));
    });
    pickerGenFilterEl.querySelectorAll("[data-generation]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    renderPickerResults();
    pickerSearchEl.focus();
  }

  function closePokemonPicker(): void {
    overlayEl.hidden = true;
    context.updateBodyScrollLock();
    activeSlotIndex = null;
  }

  function clearPokemonPickerFilters(): void {
    pickerState.search = "";
    pickerState.types.clear();
    pickerState.typeMode = "or";
    pickerState.generations.clear();
    pickerState.move = "";
    pickerState.exclusive = new Set(["all"]);

    if (pickerSearchEl) pickerSearchEl.value = "";
    if (pickerMoveFilterEl) pickerMoveFilterEl.value = "";

    overlayEl.querySelectorAll<HTMLButtonElement>("[data-type], [data-generation]").forEach((b) => {
      b.setAttribute("aria-pressed", "false");
    });
    pickerTypeModeToggleEl?.querySelectorAll<HTMLButtonElement>("[data-picker-type-mode]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.pickerTypeMode === "or"));
    });
    updatePickerExclusiveToggleUI();
    renderPickerResults();
  }

  function populatePickerFilters(): void {
    const locale = context.getLocale();
    const typeChart = context.getTypeChart();
    if (!typeChart) return;

    const typeChips = typeChart.types
      .map(
        (type) =>
          `<button class="filter-chip" type="button" data-type="${type}" aria-pressed="false" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</button>`
      )
      .join("");

    pickerTypeFilterEl.innerHTML = `<div class="filter-group__row">${typeChips}</div>`;

    const genChips = context
      .getGenerations()
      .map((g) => {
        const label = g.displayName.replace(/^(Generación|Generation)\s*/i, "");
        return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="false">${label}</button>`;
      })
      .join("");

    pickerGenFilterEl.innerHTML = `<div class="filter-group__row">${genChips}</div>`;
    pickerMoveOptionsEl.innerHTML = context
      .getMoveIndex()
      .map((m) => {
        const meta = context.getMoveDetailsMap()[m];
        const localized = meta?.nameEs && locale === "es" ? meta.nameEs : meta?.nameEn ? meta.nameEn : m;
        return `<option value="${localized}">${localized !== m ? ` (${formatLabel(m)})` : ""}</option>`;
      })
      .join("");

    if (pickerGameFilterEl) {
      pickerGameFilterEl.innerHTML = getGameOptionsHTML(context.getGenerations(), pickerState.game, locale);
      pickerGameFilterEl.value = pickerState.game;
    }
    if (teamHeaderGameSelectEl) {
      teamHeaderGameSelectEl.innerHTML = getGameOptionsHTML(context.getGenerations(), pickerState.game, locale);
      teamHeaderGameSelectEl.value = pickerState.game;
    }
  }

  // Event wiring
  pickerCloseBtn.addEventListener("click", closePokemonPicker);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closePokemonPicker();
  });

  let pickerSearchDebounce: number | undefined;
  pickerSearchEl.addEventListener("input", () => {
    window.clearTimeout(pickerSearchDebounce);
    pickerSearchDebounce = window.setTimeout(() => {
      pickerState.search = pickerSearchEl.value.trim().toLowerCase();
      renderPickerResults();
    }, 200);
  });

  pickerTypeFilterEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-type]");
    if (!btn) return;
    const t = btn.dataset.type!;
    const pressed = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", String(!pressed));
    if (pressed) pickerState.types.delete(t);
    else pickerState.types.add(t);
    renderPickerResults();
  });

  pickerTypeModeToggleEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-type-mode]");
    if (!btn) return;
    const mode = btn.dataset.pickerTypeMode as "or" | "and";
    if (!mode || mode === pickerState.typeMode) return;
    pickerState.typeMode = mode;
    pickerTypeModeToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-type-mode]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    renderPickerResults();
  });

  pickerGenFilterEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-generation]");
    if (!btn) return;
    const g = btn.dataset.generation!;
    const pressed = btn.getAttribute("aria-pressed") === "true";
    btn.setAttribute("aria-pressed", String(!pressed));
    if (pressed) pickerState.generations.delete(g);
    else pickerState.generations.add(g);
    renderPickerResults();
  });

  pickerMoveFilterEl.addEventListener("input", () => {
    const val = pickerMoveFilterEl.value.trim().toLowerCase();
    if (!val) {
      pickerState.move = "";
    } else {
      const match = Object.entries(context.getMoveDetailsMap()).find(([slug, meta]) => {
        if (slug.toLowerCase() === val) return true;
        if (formatLabel(slug).toLowerCase() === val) return true;
        if (meta.nameEs && meta.nameEs.toLowerCase() === val) return true;
        if (meta.nameEn && meta.nameEn.toLowerCase() === val) return true;
        return false;
      });
      pickerState.move = match ? match[0] : val;
    }
    renderPickerResults();
  });

  pickerGameFilterEl?.addEventListener("change", () => {
    pickerState.game = pickerGameFilterEl.value;
    setSelectedGame(pickerState.game);
    if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = pickerState.game;
    pickerState.exclusive = new Set(["all"]);
    updatePickerGameModeToggleUI();
    updatePickerExclusiveToggleUI();
    context.renderStrengthsPanel();
    renderPickerResults();
  });

  teamHeaderGameSelectEl?.addEventListener("change", () => {
    pickerState.game = teamHeaderGameSelectEl.value;
    setSelectedGame(pickerState.game);
    if (pickerGameFilterEl) pickerGameFilterEl.value = pickerState.game;
    pickerState.exclusive = new Set(["all"]);
    updatePickerGameModeToggleUI();
    updatePickerExclusiveToggleUI();
    context.renderStrengthsPanel();
    if (!overlayEl.hidden) renderPickerResults();
  });

  pickerGameModeToggleEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-game-mode]");
    if (!btn) return;
    const mode = btn.dataset.pickerGameMode as GameDexMode;
    if (mode && mode !== pickerState.dexMode) {
      pickerState.dexMode = mode;
      setGameDexMode(mode);
      updatePickerGameModeToggleUI();
      context.renderStrengthsPanel();
      renderPickerResults();
    }
  });

  pickerExclusiveToggleEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-exclusive-filter]");
    if (!btn) return;
    const filter = btn.dataset.pickerExclusiveFilter;
    if (!filter) return;

    const nonAllButtons = Array.from(
      pickerExclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-exclusive-filter]")
    ).filter((b) => b.dataset.pickerExclusiveFilter !== "all");

    if (filter === "all") {
      pickerState.exclusive = new Set(["all"]);
    } else {
      pickerState.exclusive.delete("all");
      if (pickerState.exclusive.has(filter)) {
        pickerState.exclusive.delete(filter);
      } else {
        pickerState.exclusive.add(filter);
      }
      if (pickerState.exclusive.size === 0 || pickerState.exclusive.size >= nonAllButtons.length) {
        pickerState.exclusive = new Set(["all"]);
      }
    }

    pickerExclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-exclusive-filter]").forEach((b) => {
      b.setAttribute("aria-pressed", String(pickerState.exclusive.has(b.dataset.pickerExclusiveFilter!)));
    });
    renderPickerResults();
  });

  pickerResultsEl.addEventListener("click", async (e) => {
    const clearBtn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-clear-pokemon-filters]");
    if (clearBtn) {
      clearPokemonPickerFilters();
      return;
    }

    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-pick]");
    if (!btn || activeSlotIndex === null) return;
    const id = Number(btn.dataset.pokemonId);
    const pokemon = context.getPokemonById().get(id);

    const detail = await getPokemonDetail(id).catch(() => null);
    const baseStats = detail ? { ...detail.stats } : {};
    const defaultAbility = getDefaultAbility(detail);

    const nextTeam = setTeamSlot(activeSlotIndex, id, baseStats, null, defaultAbility);
    context.setTeam(nextTeam);
    context.renderSingleSlot(activeSlotIndex, true);
    context.renderStrengthsPanel();
    if (pokemon) {
      const locale = context.getLocale();
      toast.success(
        locale === "es"
          ? `${capitalize(pokemon.name)} agregado al equipo.`
          : `${capitalize(pokemon.name)} added to the team.`
      );
    }
    closePokemonPicker();
  });

  return {
    openPokemonPicker,
    closePokemonPicker,
    populatePickerFilters,
    renderPickerResults,
    updatePickerGameModeToggleUI,
    updatePickerExclusiveToggleUI,
    isOverlayOpen: () => !overlayEl.hidden,
  };
}
