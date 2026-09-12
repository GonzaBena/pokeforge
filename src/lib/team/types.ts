import type {
  GameDexData,
  GameDexMode,
  GenerationInfo,
  MoveData,
  Pokemon,
  TeamState,
  TypeChart,
} from "../types";
import type { Locale } from "../i18n/translations";

export interface GameSpeciesSetEntry {
  regional: Set<number>;
  obtainable: Set<number>;
}

export interface PickerState {
  search: string;
  types: Set<string>;
  typeMode: "or" | "and";
  generations: Set<string>;
  move: string;
  game: string;
  dexMode: GameDexMode;
  exclusive: Set<string>;
}

export interface MovePickerRow {
  name: string;
  method: string;
  methodLabel: string;
  level: number;
}

export interface EmptyStateOptions {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  actionAttr?: string;
}

export interface DraggedItemState {
  slotIndex: number;
  itemId: string;
  droppedOnSlot: boolean;
}

export interface DraggedMoveState {
  slotIndex: number;
  moveIndex: number;
}

export interface TouchDragMoveState {
  slotIndex: number;
  moveIndex: number;
  card: HTMLElement;
}

export interface TouchDragItemState {
  slotIndex: number;
  itemId: string;
  pillEl: HTMLElement;
  startX: number;
  startY: number;
  isDragging: boolean;
}

export interface TouchDragSlotState {
  slotIndex: number;
  columnEl: HTMLElement;
  startX: number;
  startY: number;
  isDragging: boolean;
}

export interface TeamContext {
  getTeam(): TeamState;
  setTeam(next: TeamState): void;
  getAllPokemon(): Pokemon[];
  getPokemonById(): Map<number, Pokemon>;
  getTypeChart(): TypeChart | null;
  getGenerations(): GenerationInfo[];
  getMoveIndex(): string[];
  getMoveDetailsMap(): Record<string, MoveData>;
  getGameDexData(): GameDexData | null;
  getGameSpeciesSets(): Map<string, GameSpeciesSetEntry>;
  getPickerState(): PickerState;
  getActivePanelTab(): "defense" | "offense";
  setActivePanelTab(tab: "defense" | "offense"): void;
  getActiveOffenseMode(): "moves" | "stab";
  setActiveOffenseMode(mode: "moves" | "stab"): void;
  getActiveDensity(): "compact" | "detailed";
  setActiveDensity(density: "compact" | "detailed"): void;
  getLocale(): Locale;

  // Cross-module update notifications
  renderSingleSlot(index: number, animatePop?: boolean): void;
  renderAllSlots(): void;
  renderStrengthsPanel(): void;
  renderTypeMatrix(): void;
  renderSynergyPanel(): void;
  updateBodyScrollLock(): void;
  handleCrossHighlight(targetType: string | null): void;

  // Modals
  openPokemonPicker(slotIndex: number): void;
  closePokemonPicker(): void;
  openMovePicker(slotIndex: number, moveIndex: number): void;
  closeMovePicker(): void;
  openItemPicker(slotIndex: number): void;
  closeItemPicker(): void;
  openTypeMatrixModal(): void;
  closeTypeMatrixModal(): void;
  openSynergyModal(): void;
  closeSynergyModal(): void;
  openTeamCardModal(): void;
  closeTeamCardModal(): void;
}
