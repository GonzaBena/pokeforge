import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ITEMS_DATABASE,
  getAllItems,
  getItemById,
  getItemDisplayName,
  filterItems,
  getItemSpriteUrl,
} from "../src/lib/items";
import type { ItemCategory } from "../src/lib/types";

const VALID_CATEGORIES: Set<ItemCategory> = new Set([
  "competitive",
  "stat-boost",
  "type-boost",
  "defensive",
  "berries",
  "species-specific",
  "utility",
]);

describe("Items Database - Integrity & Coverage", () => {
  it("contains no duplicate item IDs and exposes all items", () => {
    const all = getAllItems();
    assert.equal(all.length, ITEMS_DATABASE.length);
    const ids = new Set<string>();
    for (const item of all) {
      assert.equal(
        ids.has(item.id),
        false,
        `Duplicate item ID found: ${item.id}`
      );
      ids.add(item.id);
    }
  });

  it("ensures all items have valid categories and localized text", () => {
    for (const item of ITEMS_DATABASE) {
      assert.ok(item.id, `Item has empty ID`);
      assert.ok(VALID_CATEGORIES.has(item.category), `Item ${item.id} has invalid category: ${item.category}`);
      assert.ok(item.nameEs && item.nameEs.trim().length > 0, `Item ${item.id} missing nameEs`);
      assert.ok(item.nameEn && item.nameEn.trim().length > 0, `Item ${item.id} missing nameEn`);
      assert.ok(item.shortDescEs && item.shortDescEs.trim().length > 0, `Item ${item.id} missing shortDescEs`);
      assert.ok(item.shortDescEn && item.shortDescEn.trim().length > 0, `Item ${item.id} missing shortDescEn`);
    }
  });

  it("includes Quick Claw (Garra Rápida) and popular battle items", () => {
    const quickClaw = getItemById("quick-claw");
    assert.ok(quickClaw, "quick-claw should be present in database");
    assert.equal(quickClaw.nameEs, "Garra Rápida");
    assert.equal(quickClaw.nameEn, "Quick Claw");

    const kingsRock = getItemById("kings-rock");
    assert.ok(kingsRock, "kings-rock should be present in database");
    assert.equal(kingsRock.nameEs, "Roca del Rey");

    const scopeLens = getItemById("scope-lens");
    assert.ok(scopeLens, "scope-lens should be present in database");

    const muscleBand = getItemById("muscle-band");
    assert.ok(muscleBand, "muscle-band should be present in database");

    const wiseGlasses = getItemById("wise-glasses");
    assert.ok(wiseGlasses, "wise-glasses should be present in database");

    const shellBell = getItemById("shell-bell");
    assert.ok(shellBell, "shell-bell should be present in database");
  });

  it("resolves sprite URLs correctly", () => {
    const url = getItemSpriteUrl("quick-claw");
    assert.equal(
      url,
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/quick-claw.png"
    );
  });

  it("filters items correctly by query in Spanish and English", () => {
    const garraMatches = filterItems("garra", "all", "es");
    assert.ok(
      garraMatches.some((i) => i.id === "quick-claw"),
      "Query 'garra' should find quick-claw"
    );

    const quickMatches = filterItems("quick", "all", "en");
    assert.ok(
      quickMatches.some((i) => i.id === "quick-claw"),
      "Query 'quick' should find quick-claw"
    );

    const categoryFiltered = filterItems("", "utility", "es");
    assert.ok(
      categoryFiltered.every((i) => i.category === "utility"),
      "All items must match the filtered category"
    );
    assert.ok(
      categoryFiltered.some((i) => i.id === "quick-claw"),
      "quick-claw should be in category 'utility'"
    );
  });

  it("getItemDisplayName returns the right locale name", () => {
    assert.equal(getItemDisplayName("quick-claw", "es"), "Garra Rápida");
    assert.equal(getItemDisplayName("quick-claw", "en"), "Quick Claw");
    assert.equal(getItemDisplayName("non-existent-item", "es"), "");
  });
});
