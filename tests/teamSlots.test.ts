import test from "node:test";
import assert from "node:assert/strict";
import { renderSlotHTML } from "../src/lib/team/slots";
import type { MoveData, Pokemon, TeamSlotState } from "../src/lib/types";

test("team slots - renderSlotHTML empty slot", () => {
  const html = renderSlotHTML(0, null, undefined, "es", {});
  assert.match(html, /data-slot-column="0"/);
  assert.match(html, /data-team-slot/);
  assert.match(html, /data-slot-index="0"/);
  assert.match(html, /Elegir Pokémon/);
});

test("team slots - renderSlotHTML filled slot with moves and item", () => {
  const pokemon: Pokemon = {
    id: 25,
    name: "pikachu",
    types: ["electric"],
    generation: "generation-i",
    sprites: {
      default: "https://example.com/pikachu.png",
      officialArtwork: "https://example.com/pikachu-art.png",
    },
    moves: ["thunderbolt", "quick-attack"],
  };

  const slotData: TeamSlotState = {
    pokemonId: 25,
    moves: ["thunderbolt", "quick-attack", null, null],
    item: "light-ball",
    ability: "static",
    nature: "timid",
  };

  const moveDetailsMap: Record<string, MoveData> = {
    thunderbolt: {
      name: "thunderbolt",
      type: "electric",
      category: "special",
      power: 90,
      accuracy: 100,
      pp: 15,
      nameEs: "Rayo",
      nameEn: "Thunderbolt",
      descriptionEs: "Lanza un rayo de electricidad.",
      descriptionEn: "A strong electric attack.",
    },
    "quick-attack": {
      name: "quick-attack",
      type: "normal",
      category: "physical",
      power: 40,
      accuracy: 100,
      pp: 30,
      nameEs: "Ataque Rápido",
      nameEn: "Quick Attack",
      descriptionEs: "Ataque veloz con prioridad.",
      descriptionEn: "An extremely fast attack.",
    },
  };

  const html = renderSlotHTML(1, pokemon, slotData, "es", moveDetailsMap);

  assert.match(html, /data-slot-column="1"/);
  assert.match(html, /data-remove-slot/);
  assert.match(html, /pikachu/);
  assert.match(html, /#0025/);
  assert.match(html, /Miedosa/); // timid in Spanish
  assert.match(html, /data-item-pill/); // light-ball equipped
  assert.match(html, /Rayo/); // move 1 localized
  assert.match(html, /Ataque Rápido/); // move 2 localized
  assert.match(html, /data-select-move[\s\S]*Ataque 3/); // move 3 empty
  assert.match(html, /data-select-move[\s\S]*Ataque 4/); // move 4 empty
});
