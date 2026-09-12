import test from "node:test";
import assert from "node:assert/strict";
import {
  autoDetectGameFromTeam,
  getPickerExclusiveMap,
  formatMult,
  filterPokemonList,
} from "../src/lib/team/helpers";
import type { GameDexData, GameVersionMeta, Pokemon, TeamState } from "../src/lib/types";

test("team helpers - formatMult", () => {
  assert.equal(formatMult(0), "0×");
  assert.equal(formatMult(0.25), "¼×");
  assert.equal(formatMult(0.5), "½×");
  assert.equal(formatMult(1), "1×");
  assert.equal(formatMult(2), "2×");
  assert.equal(formatMult(4), "4×");
});

test("team helpers - autoDetectGameFromTeam", () => {
  const team: TeamState = {
    size: 6,
    slots: [
      { pokemonId: 1, moves: [], item: null, ability: null }, // Bulbasaur
      { pokemonId: 4, moves: [], item: null, ability: null }, // Charmander
      { pokemonId: null, moves: [], item: null, ability: null },
    ],
  };

  const gameDexData: GameDexData = {
    red: { regional: [1, 4], obtainable: [1, 4] },
    gold: { regional: [152], obtainable: [1, 4, 152] },
    sword: { regional: [810], obtainable: [810] },
  };

  const gameSpeciesSets = new Map<string, { regional: Set<number>; obtainable: Set<number> }>([
    ["red", { regional: new Set([1, 4]), obtainable: new Set([1, 4]) }],
    ["gold", { regional: new Set([152]), obtainable: new Set([1, 4, 152]) }],
    ["sword", { regional: new Set([810]), obtainable: new Set([810]) }],
  ]);

  const detected = autoDetectGameFromTeam(team, gameDexData, gameSpeciesSets);
  assert.equal(detected, "gold");

  const emptyTeam: TeamState = {
    size: 6,
    slots: [{ pokemonId: null, moves: [], item: null, ability: null }],
  };
  assert.equal(autoDetectGameFromTeam(emptyTeam, gameDexData, gameSpeciesSets), "");
});

test("team helpers - getPickerExclusiveMap", () => {
  const versions: GameVersionMeta[] = [
    { id: "scarlet", name: "Scarlet", nameEs: "Escarlata", color: "#e03a3a" },
    { id: "violet", name: "Violet", nameEs: "Púrpura", color: "#8a44c8" },
  ];

  const gameDexData: GameDexData = {
    "scarlet-violet": {
      regional: [100, 200],
      obtainable: [100, 200],
      versions,
      exclusives: {
        scarlet: [100],
        violet: [200],
      },
    },
  };

  const exclusiveMap = getPickerExclusiveMap("scarlet-violet", gameDexData);
  assert.equal(exclusiveMap.size, 2);
  assert.equal(exclusiveMap.get(100)?.id, "scarlet");
  assert.equal(exclusiveMap.get(200)?.id, "violet");

  const emptyMap = getPickerExclusiveMap("unknown", gameDexData);
  assert.equal(emptyMap.size, 0);
});

test("team helpers - filterPokemonList", () => {
  const samplePokemon: Pokemon[] = [
    {
      id: 1,
      name: "bulbasaur",
      types: ["grass", "poison"],
      generation: "generation-i",
      sprites: { default: "", officialArtwork: "" },
      moves: ["tackle", "vine-whip"],
    },
    {
      id: 4,
      name: "charmander",
      types: ["fire"],
      generation: "generation-i",
      sprites: { default: "", officialArtwork: "" },
      moves: ["scratch", "ember"],
    },
    {
      id: 7,
      name: "squirtle",
      types: ["water"],
      generation: "generation-i",
      sprites: { default: "", officialArtwork: "" },
      moves: ["tackle", "water-gun"],
    },
    {
      id: 152,
      name: "chikorita",
      types: ["grass"],
      generation: "generation-ii",
      sprites: { default: "", officialArtwork: "" },
      moves: ["tackle", "razor-leaf"],
    },
  ];

  // Filter by search
  const res1 = filterPokemonList(samplePokemon, {
    search: "char",
    types: new Set(),
    typeMode: "or",
    generations: new Set(),
    move: "",
    gameSpeciesSet: null,
    exclusivesMap: new Map(),
    exclusiveFilter: new Set(["all"]),
  });
  assert.equal(res1.length, 1);
  assert.equal(res1[0].name, "charmander");

  // Filter by types OR
  const res2 = filterPokemonList(samplePokemon, {
    search: "",
    types: new Set(["grass", "water"]),
    typeMode: "or",
    generations: new Set(),
    move: "",
    gameSpeciesSet: null,
    exclusivesMap: new Map(),
    exclusiveFilter: new Set(["all"]),
  });
  assert.equal(res2.length, 3);

  // Filter by types AND
  const res3 = filterPokemonList(samplePokemon, {
    search: "",
    types: new Set(["grass", "poison"]),
    typeMode: "and",
    generations: new Set(),
    move: "",
    gameSpeciesSet: null,
    exclusivesMap: new Map(),
    exclusiveFilter: new Set(["all"]),
  });
  assert.equal(res3.length, 1);
  assert.equal(res3[0].name, "bulbasaur");
});
