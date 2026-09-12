import {
  getAllPokemon,
  getGameDexData,
  getGenerations,
  getMoveDetailsMap,
  getMoveIndex,
  getTypeChart,
} from "../lib/pokedexData";
import {
  DATA_RESET_EVENT,
  GAME_CHANGED_EVENT,
  GAME_DEX_MODE_CHANGED_EVENT,
  TEAM_CHANGED_EVENT,
  getTeam,
  setSelectedGame,
} from "../lib/storage";
import type { GameDexData, GameDexMode } from "../lib/types";
import { createTeamContext } from "../lib/team/context";
import { setupSlots } from "../lib/team/slots";
import { setupDragAndDrop } from "../lib/team/dragDrop";
import { setupStrengthsPanel } from "../lib/team/strengthsPanel";
import { setupTypeMatrixModal } from "../lib/team/typeMatrixModal";
import { setupSynergyModal } from "../lib/team/synergyModal";
import { setupPokemonPicker } from "../lib/team/pickers/pokemonPicker";
import { setupMovePicker } from "../lib/team/pickers/movePicker";
import { setupItemPicker } from "../lib/team/pickers/itemPicker";
import { setupExportModal } from "../lib/team/exportModal";
import { autoDetectGameFromTeam } from "../lib/team/helpers";
import type { GameSpeciesSetEntry } from "../lib/team/types";

async function init(): Promise<void> {
  const slotsEl = document.querySelector<HTMLElement>("[data-team-slots]");
  if (!slotsEl) return;

  const initialTeam = getTeam();

  const [full, chart, gens, moves, moveDetails, gameDex] = await Promise.all([
    getAllPokemon(),
    getTypeChart(),
    getGenerations(),
    getMoveIndex(),
    getMoveDetailsMap(),
    getGameDexData().catch(() => null),
  ]);

  const gameSpeciesSets = new Map<string, GameSpeciesSetEntry>();
  let resolvedGameDex: GameDexData | null = null;

  if (gameDex) {
    resolvedGameDex = gameDex;
    for (const [gname, entry] of Object.entries(gameDex)) {
      gameSpeciesSets.set(gname, {
        regional: new Set(entry.regional),
        obtainable: new Set(entry.obtainable),
      });
    }
  }

  const context = createTeamContext({
    initialTeam,
    allPokemon: full,
    typeChart: chart,
    generations: gens,
    moveIndex: moves,
    moveDetailsMap: moveDetails,
    gameDexData: resolvedGameDex,
    gameSpeciesSets,
  });

  const pickerState = context.getPickerState();

  // If no game is set yet, try to auto-detect from the current team
  if (!pickerState.game) {
    const autoGame = autoDetectGameFromTeam(initialTeam, resolvedGameDex, gameSpeciesSets);
    if (autoGame) {
      pickerState.game = autoGame;
      setSelectedGame(autoGame);
    }
  }

  // Initialize modular controllers
  const slotsModule = setupSlots(slotsEl, context);
  setupDragAndDrop(slotsEl, context);
  const strengthsModule = setupStrengthsPanel(context);
  const typeMatrixModule = setupTypeMatrixModal(context);
  const synergyModule = setupSynergyModal(context);
  const pokemonPickerModule = setupPokemonPicker(context);
  const movePickerModule = setupMovePicker(context);
  const itemPickerModule = setupItemPicker(context);
  const exportModule = setupExportModal(context);

  // Register delegate implementations with context
  (context as any)._registerDelegates({
    renderSingleSlot: slotsModule.renderSingleSlot,
    renderAllSlots: slotsModule.renderAllSlots,
    renderStrengthsPanel: strengthsModule.renderStrengthsPanel,
    renderTypeMatrix: typeMatrixModule.renderTypeMatrix,
    renderSynergyPanel: synergyModule.renderSynergyPanel,
    handleCrossHighlight: strengthsModule.handleCrossHighlight,
    openPokemonPicker: pokemonPickerModule.openPokemonPicker,
    closePokemonPicker: pokemonPickerModule.closePokemonPicker,
    openMovePicker: movePickerModule.openMovePicker,
    closeMovePicker: movePickerModule.closeMovePicker,
    openItemPicker: itemPickerModule.openItemPicker,
    closeItemPicker: itemPickerModule.closeItemPicker,
    openTypeMatrixModal: typeMatrixModule.openTypeMatrixModal,
    closeTypeMatrixModal: typeMatrixModule.closeTypeMatrixModal,
    openSynergyModal: synergyModule.openSynergyModal,
    closeSynergyModal: synergyModule.closeSynergyModal,
    openTeamCardModal: exportModule.openTeamCardModal,
    closeTeamCardModal: exportModule.closeTeamCardModal,
  });

  // Global document Escape handling
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const strengthsGuideOverlay = document.querySelector<HTMLElement>("[data-strengths-guide-overlay]");
      if (strengthsGuideOverlay && !strengthsGuideOverlay.hidden) strengthsModule.closeStrengthsGuideModal();
      else if (synergyModule.isOverlayOpen()) synergyModule.closeSynergyModal();
      else if (typeMatrixModule.isOverlayOpen()) typeMatrixModule.closeTypeMatrixModal();
      else if (exportModule.isOverlayOpen()) exportModule.closeTeamCardModal();
      else if (itemPickerModule.isOverlayOpen()) itemPickerModule.closeItemPicker();
      else if (movePickerModule.isOverlayOpen()) movePickerModule.closeMovePicker();
      else if (pokemonPickerModule.isOverlayOpen()) pokemonPickerModule.closePokemonPicker();
    }
  });

  // Storage and window events
  window.addEventListener(DATA_RESET_EVENT, () => {
    const freshTeam = getTeam();
    context.setTeam(freshTeam);
    for (let i = 0; i < freshTeam.slots.length; i++) {
      slotsModule.renderSingleSlot(i);
    }
    strengthsModule.renderStrengthsPanel();
    if (typeMatrixModule.isOverlayOpen()) typeMatrixModule.renderTypeMatrix();
  });

  window.addEventListener(TEAM_CHANGED_EVENT, () => {
    const freshTeam = getTeam();
    context.setTeam(freshTeam);
    slotsModule.renderAllSlots();
    strengthsModule.renderStrengthsPanel();
    if (typeMatrixModule.isOverlayOpen()) typeMatrixModule.renderTypeMatrix();
  });

  const pickerGameFilterEl = document.querySelector<HTMLSelectElement>("[data-picker-game-filter]");
  const teamHeaderGameSelectEl = document.querySelector<HTMLSelectElement>("[data-team-header-game-select]");

  window.addEventListener(GAME_CHANGED_EVENT, (e) => {
    const newGame = (e as CustomEvent<{ game: string }>).detail?.game ?? "";
    if (newGame !== pickerState.game) {
      pickerState.game = newGame;
      if (pickerGameFilterEl) pickerGameFilterEl.value = newGame;
      if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = newGame;
      pickerState.exclusive = new Set(["all"]);
      pokemonPickerModule.updatePickerGameModeToggleUI();
      pokemonPickerModule.updatePickerExclusiveToggleUI();
      strengthsModule.renderStrengthsPanel();
      if (pokemonPickerModule.isOverlayOpen()) pokemonPickerModule.renderPickerResults();
    }
  });

  window.addEventListener(GAME_DEX_MODE_CHANGED_EVENT, (e) => {
    const newMode = (e as CustomEvent<{ mode: GameDexMode }>).detail?.mode ?? "regional";
    if (newMode !== pickerState.dexMode) {
      pickerState.dexMode = newMode;
      pokemonPickerModule.updatePickerGameModeToggleUI();
      if (pokemonPickerModule.isOverlayOpen()) pokemonPickerModule.renderPickerResults();
    }
  });

  // Initial page render
  pokemonPickerModule.populatePickerFilters();
  strengthsModule.updateDensityUI();
  slotsModule.renderAllSlots();
  strengthsModule.renderStrengthsPanel();
}

init();
