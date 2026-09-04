import { bindModalEvents } from "./events";
import { closeModal, openPokemonModal } from "./lifecycle";
import { render } from "./render";
import type { PokemonModalOptions, RenderContext } from "./types";

// Bind modal event listeners on client load
bindModalEvents();

export { openPokemonModal, closeModal, render, type PokemonModalOptions, type RenderContext };
