import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMoveDescription } from "../src/lib/i18n/translations";
import { buildMoveTableRows, getMoveColumns } from "../src/lib/pokemonModal/sections/tables";
import type { MoveData, MoveDetail } from "../src/lib/types";

describe("Move Description Helper", () => {
  it("returns Spanish description when locale is 'es'", () => {
    const meta: MoveData = {
      name: "tackle",
      type: "normal",
      category: "physical",
      power: 40,
      pp: 35,
      accuracy: 100,
      descriptionEs: "Embestida con todo el cuerpo.",
      descriptionEn: "A full-body charge attack.",
    };
    assert.equal(getMoveDescription(meta, "es"), "Embestida con todo el cuerpo.");
  });

  it("returns English description when locale is 'en'", () => {
    const meta: MoveData = {
      name: "tackle",
      type: "normal",
      category: "physical",
      power: 40,
      pp: 35,
      accuracy: 100,
      descriptionEs: "Embestida con todo el cuerpo.",
      descriptionEn: "A full-body charge attack.",
    };
    assert.equal(getMoveDescription(meta, "en"), "A full-body charge attack.");
  });

  it("falls back to English when Spanish is missing in 'es' locale", () => {
    const meta: Partial<MoveData> = {
      name: "test-move",
      descriptionEn: "A test move in English.",
    };
    assert.equal(getMoveDescription(meta, "es"), "A test move in English.");
  });

  it("falls back to Spanish when English is missing in 'en' locale", () => {
    const meta: Partial<MoveData> = {
      name: "test-move",
      descriptionEs: "Movimiento de prueba en español.",
    };
    assert.equal(getMoveDescription(meta, "en"), "Movimiento de prueba en español.");
  });

  it("returns fallback placeholder when no description is present", () => {
    assert.equal(getMoveDescription(undefined, "es"), "Sin descripción disponible.");
    assert.equal(getMoveDescription(undefined, "en"), "No description available.");
  });
});

describe("Move Table Row and Column Rendering", () => {
  const sampleDetails: MoveDetail[] = [
    { name: "thunderbolt", method: "machine", level: 0 },
  ];
  const sampleMap: Record<string, MoveData> = {
    thunderbolt: {
      name: "thunderbolt",
      type: "electric",
      category: "special",
      power: 90,
      pp: 15,
      accuracy: 100,
      nameEs: "Rayo",
      nameEn: "Thunderbolt",
      descriptionEs: "Potente ataque eléctrico que puede paralizar al objetivo.",
      descriptionEn: "A strong electric blast that may paralyze.",
    },
  };

  it("buildMoveTableRows includes localized description in row data", () => {
    const rowsEs = buildMoveTableRows(sampleDetails, "es", sampleMap);
    assert.equal(rowsEs.length, 1);
    assert.equal(rowsEs[0].description, "Potente ataque eléctrico que puede paralizar al objetivo.");

    const rowsEn = buildMoveTableRows(sampleDetails, "en", sampleMap);
    assert.equal(rowsEn[0].description, "A strong electric blast that may paralyze.");
  });

  it("getMoveColumns renders '?' button to the left of the move name with tooltip description", () => {
    const cols = getMoveColumns("es");
    const nameCol = cols.find((c) => "accessorKey" in c && c.accessorKey === "name");
    assert.ok(nameCol, "Move column should exist");

    const rows = buildMoveTableRows(sampleDetails, "es", sampleMap);
    const mockContext = {
      getValue: () => rows[0].name,
      row: { original: rows[0] },
    } as any;

    const cellHtml = typeof nameCol.cell === "function" ? String(nameCol.cell(mockContext)) : "";
    assert.ok(cellHtml.includes("?"), "Cell must contain '?' button");
    assert.ok(cellHtml.includes("move-help-btn") || cellHtml.includes("move-help"), "Cell must have help button class");
    const visibleNameIndex = cellHtml.indexOf(`<span class="move-table__name">${rows[0].name}`);
    assert.ok(visibleNameIndex !== -1, "Visible move name span should exist");
    assert.ok(
      cellHtml.indexOf("?") < visibleNameIndex,
      "'?' button must be positioned to the left of the visible attack name",
    );
    assert.ok(
      cellHtml.includes("Potente ataque eléctrico que puede paralizar al objetivo."),
      "Cell must include the move description for hover tooltip",
    );
  });
});

describe("Move Tooltip Mobile & Touch Interaction", () => {
  it("opens on first tap when no tooltip is active", async () => {
    const { shouldToggleTooltip } = await import("../src/lib/moveTooltip");
    const dummyBtn = { id: "btn-1" };
    // active is null, clicked is dummyBtn
    const shouldToggle = shouldToggleTooltip(null, dummyBtn, 0, 1000);
    assert.equal(shouldToggle, true, "Should open on the first tap");
  });

  it("prevents immediate close when click follows pointerenter/focusin in same tap gesture (<400ms)", async () => {
    const { shouldToggleTooltip } = await import("../src/lib/moveTooltip");
    const dummyBtn = { id: "btn-1" };
    const tapStartTime = 1000;
    const clickTime = 1030; // 30ms later in the same touch tap gesture

    // active is already dummyBtn due to touch pointerenter/focusin
    const shouldToggle = shouldToggleTooltip(dummyBtn, dummyBtn, tapStartTime, clickTime);
    assert.equal(shouldToggle, false, "Should not toggle/close on the same tap gesture");
  });

  it("toggles closed on subsequent deliberate tap (>400ms) on the same button", async () => {
    const { shouldToggleTooltip } = await import("../src/lib/moveTooltip");
    const dummyBtn = { id: "btn-1" };
    const firstTapTime = 1000;
    const secondTapTime = 2200; // 1.2s later (deliberate second tap)

    const shouldToggle = shouldToggleTooltip(dummyBtn, dummyBtn, firstTapTime, secondTapTime);
    assert.equal(shouldToggle, true, "Should toggle closed on a deliberate second tap");
  });

  it("switches to another button immediately on tap", async () => {
    const { shouldToggleTooltip } = await import("../src/lib/moveTooltip");
    const dummyBtn1 = { id: "btn-1" };
    const dummyBtn2 = { id: "btn-2" };

    const shouldToggle = shouldToggleTooltip(dummyBtn1, dummyBtn2, 1000, 1100);
    assert.equal(shouldToggle, true, "Should switch and open when tapping another button");
  });
});
