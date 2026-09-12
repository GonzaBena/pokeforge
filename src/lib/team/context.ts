import { getCurrentLocale } from "../i18n/translations";
import { getGameDexMode, getSelectedGame } from "../storage";
import type { GameDexData, GenerationInfo, MoveData, Pokemon, TeamState, TypeChart } from "../types";
import type { GameSpeciesSetEntry, PickerState, TeamContext } from "./types";

export interface CreateTeamContextParams {
  initialTeam: TeamState;
  allPokemon: Pokemon[];
  typeChart: TypeChart;
  generations: GenerationInfo[];
  moveIndex: string[];
  moveDetailsMap: Record<string, MoveData>;
  gameDexData: GameDexData | null;
  gameSpeciesSets: Map<string, GameSpeciesSetEntry>;
}

export function createTeamContext(params: CreateTeamContextParams): TeamContext {
  let currentTeam = params.initialTeam;
  const allPokemon = params.allPokemon;
  const pokemonById = new Map<number, Pokemon>(allPokemon.map((p) => [p.id, p]));
  const typeChart = params.typeChart;
  const generations = params.generations;
  const moveIndex = params.moveIndex;
  const moveDetailsMap = params.moveDetailsMap;
  const gameDexData = params.gameDexData;
  const gameSpeciesSets = params.gameSpeciesSets;

  let activePanelTab: "defense" | "offense" = "defense";
  let activeOffenseMode: "moves" | "stab" = "moves";
  let activeDensity: "compact" | "detailed" =
    typeof window !== "undefined" && localStorage.getItem("poketeam_view_density") === "detailed"
      ? "detailed"
      : "compact";

  const pickerState: PickerState = {
    search: "",
    types: new Set<string>(),
    typeMode: "or",
    generations: new Set<string>(),
    move: "",
    game: getSelectedGame(),
    dexMode: getGameDexMode(),
    exclusive: new Set<string>(["all"]),
  };

  // Delegated callbacks to be registered by modules
  const delegates = {
    renderSingleSlot: (_index: number, _animatePop?: boolean) => {},
    renderAllSlots: () => {},
    renderStrengthsPanel: () => {},
    renderTypeMatrix: () => {},
    renderSynergyPanel: () => {},
    handleCrossHighlight: (_targetType: string | null) => {},
    openPokemonPicker: (_slotIndex: number) => {},
    closePokemonPicker: () => {},
    openMovePicker: (_slotIndex: number, _moveIndex: number) => {},
    closeMovePicker: () => {},
    openItemPicker: (_slotIndex: number) => {},
    closeItemPicker: () => {},
    openTypeMatrixModal: () => {},
    closeTypeMatrixModal: () => {},
    openSynergyModal: () => {},
    closeSynergyModal: () => {},
    openTeamCardModal: () => {},
    closeTeamCardModal: () => {},
  };

  function updateBodyScrollLock(): void {
    const isAnyModalOpen =
      Boolean(document.querySelector<HTMLElement>("[data-picker-overlay]:not([hidden])")) ||
      Boolean(document.querySelector<HTMLElement>("[data-move-picker-overlay]:not([hidden])")) ||
      Boolean(document.querySelector<HTMLElement>("[data-item-picker-overlay]:not([hidden])")) ||
      Boolean(document.querySelector<HTMLElement>("[data-team-card-overlay]:not([hidden])")) ||
      Boolean(document.querySelector<HTMLElement>("[data-type-matrix-overlay]:not([hidden])")) ||
      Boolean(document.querySelector<HTMLElement>("[data-synergy-modal-overlay]:not([hidden])")) ||
      Boolean(document.querySelector<HTMLElement>("[data-strengths-guide-overlay]:not([hidden])"));

    document.body.style.overflow = isAnyModalOpen ? "hidden" : "";
  }

  const context: TeamContext = {
    getTeam: () => currentTeam,
    setTeam: (next) => {
      currentTeam = next;
    },
    getAllPokemon: () => allPokemon,
    getPokemonById: () => pokemonById,
    getTypeChart: () => typeChart,
    getGenerations: () => generations,
    getMoveIndex: () => moveIndex,
    getMoveDetailsMap: () => moveDetailsMap,
    getGameDexData: () => gameDexData,
    getGameSpeciesSets: () => gameSpeciesSets,
    getPickerState: () => pickerState,
    getActivePanelTab: () => activePanelTab,
    setActivePanelTab: (tab) => {
      activePanelTab = tab;
    },
    getActiveOffenseMode: () => activeOffenseMode,
    setActiveOffenseMode: (mode) => {
      activeOffenseMode = mode;
    },
    getActiveDensity: () => activeDensity,
    setActiveDensity: (density) => {
      activeDensity = density;
    },
    getLocale: () => getCurrentLocale(),

    renderSingleSlot: (i, anim) => delegates.renderSingleSlot(i, anim),
    renderAllSlots: () => delegates.renderAllSlots(),
    renderStrengthsPanel: () => delegates.renderStrengthsPanel(),
    renderTypeMatrix: () => delegates.renderTypeMatrix(),
    renderSynergyPanel: () => delegates.renderSynergyPanel(),
    updateBodyScrollLock,
    handleCrossHighlight: (t) => delegates.handleCrossHighlight(t),

    openPokemonPicker: (idx) => delegates.openPokemonPicker(idx),
    closePokemonPicker: () => delegates.closePokemonPicker(),
    openMovePicker: (s, m) => delegates.openMovePicker(s, m),
    closeMovePicker: () => delegates.closeMovePicker(),
    openItemPicker: (s) => delegates.openItemPicker(s),
    closeItemPicker: () => delegates.closeItemPicker(),
    openTypeMatrixModal: () => delegates.openTypeMatrixModal(),
    closeTypeMatrixModal: () => delegates.closeTypeMatrixModal(),
    openSynergyModal: () => delegates.openSynergyModal(),
    closeSynergyModal: () => delegates.closeSynergyModal(),
    openTeamCardModal: () => delegates.openTeamCardModal(),
    closeTeamCardModal: () => delegates.closeTeamCardModal(),
  };

  // Expose registration methods onto context instance for bootstrapping
  (context as any)._registerDelegates = (handlers: Partial<typeof delegates>) => {
    Object.assign(delegates, handlers);
  };

  return context;
}
