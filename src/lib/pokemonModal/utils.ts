import { getCurrentLocale, getTypeName } from "../i18n/translations";
import { typeColor } from "../typeColors";

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatLabel(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function typeBadgesHtml(types: string[], small = false): string {
  const locale = getCurrentLocale();
  const cls = small ? "type-badge type-badge--sm" : "type-badge";
  return types
    .map((t) => `<span class="${cls}" data-type="${t}" style="--badge-bg:${typeColor(t)}">${getTypeName(t, locale)}</span>`)
    .join("");
}

export function formatGeneration(gen: unknown): string {
  return String(gen ?? "").replace(/^(Generación|Generation)\s*/i, "").trim();
}
