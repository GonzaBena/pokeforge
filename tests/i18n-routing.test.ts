import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getLocalizedPath } from "../src/lib/i18n/translations";

describe("i18n Routing - getLocalizedPath with localized team routes", () => {
  it("maps team route to /team/ in English and /es/equipo/ in Spanish", () => {
    assert.equal(getLocalizedPath("/team/", "en"), "/team/");
    assert.equal(getLocalizedPath("/team", "en"), "/team/");
    assert.equal(getLocalizedPath("/team/", "es"), "/es/equipo/");
    assert.equal(getLocalizedPath("/team", "es"), "/es/equipo/");
  });

  it("maps /es/equipo/ to /team/ when switching to English", () => {
    assert.equal(getLocalizedPath("/es/equipo/", "en"), "/team/");
    assert.equal(getLocalizedPath("/es/equipo", "en"), "/team/");
    assert.equal(getLocalizedPath("/es/equipo/", "es"), "/es/equipo/");
  });

  it("converts legacy or Spanish /equipo/ path to /team/ in English", () => {
    assert.equal(getLocalizedPath("/equipo/", "en"), "/team/");
    assert.equal(getLocalizedPath("/equipo", "en"), "/team/");
    assert.equal(getLocalizedPath("/equipo/", "es"), "/es/equipo/");
  });

  it("preserves other routes correctly", () => {
    assert.equal(getLocalizedPath("/", "en"), "/");
    assert.equal(getLocalizedPath("/", "es"), "/es/");
    assert.equal(getLocalizedPath("/es/", "en"), "/");
    assert.equal(getLocalizedPath("/pokedex/", "en"), "/pokedex/");
    assert.equal(getLocalizedPath("/pokedex/", "es"), "/es/pokedex/");
    assert.equal(getLocalizedPath("/es/pokedex/", "en"), "/pokedex/");
    assert.equal(getLocalizedPath("/blog/", "en"), "/blog/");
    assert.equal(getLocalizedPath("/blog/", "es"), "/es/blog/");
    assert.equal(getLocalizedPath("/es/blog/", "en"), "/blog/");
  });
});
