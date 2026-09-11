import type { ColumnDef } from "@tanstack/table-core";
import {
  getCategoryName,
  getGameTitle,
  getMoveName,
  getTranslations,
  getTypeName,
  type Locale,
} from "../../i18n/translations";
import { typeColor } from "../../typeColors";
import type { AcquisitionRow, MoveData, MoveDetail } from "../../types";
import { METHOD_LABELS } from "../constants";
import type { MoveTableRow } from "../types";
import { formatGeneration, formatLabel } from "../utils";

export function buildMoveTableRows(
  moveDetails: MoveDetail[],
  locale: Locale,
  moveDetailsMap?: Record<string, MoveData>,
): MoveTableRow[] {
  const methodMap = METHOD_LABELS[locale] ?? METHOD_LABELS.en;
  return moveDetails.map((m) => {
    const meta = moveDetailsMap?.[m.name];
    const category = meta?.category ?? null;
    const type = meta?.type ?? null;
    return {
      name: getMoveName(m.name, locale, meta),
      type,
      typeName: type ? getTypeName(type, locale) : "",
      category,
      categoryLabel: category ? getCategoryName(category, locale) : "",
      power: meta?.power ?? null,
      pp: meta?.pp ?? null,
      accuracy: meta?.accuracy ?? null,
      method: m.method,
      methodLabel: methodMap[m.method] ?? formatLabel(m.method),
      level: m.level,
    };
  });
}

export function getLocationColumns(locale: Locale): ColumnDef<AcquisitionRow, unknown>[] {
  const t = getTranslations(locale);
  return [
    {
      accessorKey: "generation",
      header: "Gen.",
      size: 40,
      cell: (info) => formatGeneration(info.getValue()),
    },
    {
      accessorKey: "game",
      header: t.modal.game,
      size: 190,
      cell: (info) => getGameTitle(String(info.getValue()), locale),
    },
    { accessorKey: "location", header: t.modal.location, size: 160 },
    {
      accessorKey: "method",
      header: t.modal.method,
      size: 260,
      cell: (info) => {
        const val = String(info.getValue());
        if (locale === "en" && val === "Encuentro salvaje") return "Wild encounter";
        return val;
      },
    },
  ];
}

export function getMoveColumns(locale: Locale): ColumnDef<MoveTableRow, unknown>[] {
  const t = getTranslations(locale);
  return [
    {
      accessorKey: "name",
      header: t.modal.move,
      size: 160,
      cell: (info) => `<span class="move-table__name">${String(info.getValue())}</span>`,
    },
    {
      accessorKey: "typeName",
      header: t.modal.type,
      size: 85,
      cell: (info) => {
        const type = info.row.original.type;
        const typeName = String(info.getValue());
        return type
          ? `<span class="type-badge type-badge--sm" data-type="${type}" style="--badge-bg:${typeColor(type)}">${typeName}</span>`
          : "-";
      },
    },
    {
      accessorKey: "categoryLabel",
      header: t.modal.category,
      size: 90,
      cell: (info) => {
        const category = info.row.original.category;
        const categoryLabel = String(info.getValue());
        return category
          ? `<span class="move-category-badge move-category-badge--${category}">${categoryLabel}</span>`
          : "-";
      },
    },
    {
      accessorKey: "power",
      header: t.modal.power,
      size: 55,
      sortingFn: (rowA, rowB, colId) => {
        const a = rowA.getValue<number | null>(colId);
        const b = rowB.getValue<number | null>(colId);
        const valA = a === null || a === undefined ? -1 : a;
        const valB = b === null || b === undefined ? -1 : b;
        return valA - valB;
      },
      cell: (info) => {
        const val = info.getValue<number | null>();
        return val !== null && val !== undefined ? `<span class="move-table__stat">${val}</span>` : "-";
      },
    },
    {
      accessorKey: "pp",
      header: t.modal.pp,
      size: 45,
      sortingFn: (rowA, rowB, colId) => {
        const a = rowA.getValue<number | null>(colId);
        const b = rowB.getValue<number | null>(colId);
        const valA = a === null || a === undefined ? -1 : a;
        const valB = b === null || b === undefined ? -1 : b;
        return valA - valB;
      },
      cell: (info) => {
        const val = info.getValue<number | null>();
        return val !== null && val !== undefined ? `<span class="move-table__stat">${val}</span>` : "-";
      },
    },
    {
      accessorKey: "accuracy",
      header: t.modal.accuracy,
      size: 55,
      sortingFn: (rowA, rowB, colId) => {
        const a = rowA.getValue<number | null>(colId);
        const b = rowB.getValue<number | null>(colId);
        const valA = a === null || a === undefined ? -1 : a;
        const valB = b === null || b === undefined ? -1 : b;
        return valA - valB;
      },
      cell: (info) => {
        const val = info.getValue<number | null>();
        return val !== null && val !== undefined ? `<span class="move-table__stat">${val}%</span>` : "-";
      },
    },
    {
      accessorKey: "methodLabel",
      header: t.modal.method,
      size: 85,
      cell: (info) => {
        const method = info.row.original.method;
        const methodLabel = String(info.getValue());
        return `<span class="move-method-badge move-method-badge--${method}">${methodLabel}</span>`;
      },
    },
    {
      accessorFn: (row) => row.level,
      id: "level",
      header: t.modal.level,
      size: 55,
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.method === "level-up" ? rowA.original.level : 999;
        const b = rowB.original.method === "level-up" ? rowB.original.level : 999;
        return a - b;
      },
      cell: (info) =>
        info.row.original.method === "level-up"
          ? `<span class="move-table__cell-level">${locale === "es" ? "Nv." : "Lv."} ${info.getValue()}</span>`
          : "-",
    },
  ];
}
