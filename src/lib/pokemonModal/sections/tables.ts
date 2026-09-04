import type { ColumnDef } from "@tanstack/table-core";
import { getTranslations, getGameTitle, type Locale } from "../../i18n/translations";
import type { AcquisitionRow, MoveDetail } from "../../types";
import { METHOD_LABELS } from "../constants";
import type { MoveTableRow } from "../types";
import { formatGeneration, formatLabel } from "../utils";

export function buildMoveTableRows(moveDetails: MoveDetail[], locale: Locale): MoveTableRow[] {
  const methodMap = METHOD_LABELS[locale] ?? METHOD_LABELS.en;
  return moveDetails.map((m) => ({
    name: m.name,
    method: m.method,
    methodLabel: methodMap[m.method] ?? formatLabel(m.method),
    level: m.level,
  }));
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
    { accessorKey: "name", header: t.modal.move, size: 220, cell: (info) => formatLabel(String(info.getValue())) },
    { accessorKey: "methodLabel", header: t.modal.method, size: 70 },
    {
      accessorFn: (row) => row.level,
      id: "level",
      header: t.modal.level,
      size: 50,
      cell: (info) => (info.row.original.method === "level-up" ? `${locale === "es" ? "Nv." : "Lv."} ${info.getValue()}` : "-"),
    },
  ];
}
