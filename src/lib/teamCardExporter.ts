import { toPng } from "html-to-image";
import type { MoveData, Pokemon, TeamState } from "./types";
import { typeColor } from "./typeColors";
import { toast } from "./toast";
import { getMoveName, type Locale } from "./i18n/translations";
import { getItemById, getItemDisplayName, renderItemIconHTML } from "./items";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function generateShowdownText(team: TeamState, pokemonMap: Map<number, Pokemon>): string {
  const blocks: string[] = [];

  for (const slot of team.slots) {
    if (!slot.pokemonId) continue;
    const p = pokemonMap.get(slot.pokemonId);
    if (!p) continue;

    const item = getItemById(slot.item);
    const itemStr = item ? ` @ ${item.nameEn}` : "";
    const lines: string[] = [];
    lines.push(`${capitalize(p.name)}${itemStr}`);
    if (slot.ability) {
      lines.push(`Ability: ${slot.ability.split("-").map(capitalize).join(" ")}`);
    }
    lines.push(`Types: ${p.types.map(capitalize).join(" / ")}`);
    if (slot.nature) {
      lines.push(`Nature: ${capitalize(slot.nature)}`);
    }

    if (slot.moves && slot.moves.some(Boolean)) {
      for (const m of slot.moves) {
        if (m) lines.push(`- ${m.split("-").map(capitalize).join(" ")}`);
      }
    }
    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n");
}

export function renderTeamCardHTML(
  team: TeamState,
  pokemonMap: Map<number, Pokemon>,
  locale: Locale = "es",
  moveDetailsMap?: Record<string, MoveData>,
): string {
  const activeSlots = team.slots.filter((s) => s.pokemonId !== null);

  if (activeSlots.length === 0) {
    return `
      <div class="team-card-empty">
        <i data-lucide="users" class="team-card-empty__icon"></i>
        <h3>Tu equipo está vacío</h3>
        <p>Agregá al menos un Pokémon a tu equipo para generar tu tarjeta personalizada.</p>
      </div>
    `;
  }

  const slotItemsHtml = team.slots
    .map((slot, index) => {
      if (!slot.pokemonId) {
        return `
          <div class="team-card-item team-card-item--empty">
            <span class="team-card-item__slot-num">Slot ${index + 1}</span>
            <div class="team-card-item__empty-placeholder">Vacío</div>
          </div>
        `;
      }

      const p = pokemonMap.get(slot.pokemonId);
      if (!p) return "";

      const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? "";
      const primaryType = p.types[0] ?? "normal";
      const glowColor = typeColor(primaryType);

      const typeBadges = p.types
        .map((t) => `<span class="type-badge" style="--badge-bg:${typeColor(t)}">${t}</span>`)
        .join("");

      const movesList = (slot.moves ?? [])
        .filter(Boolean)
        .map((m) => `<span class="team-card-item__move-tag">${getMoveName(m!, locale, moveDetailsMap?.[m!])}</span>`)
        .join("");

      const natureTag = slot.nature
        ? `<div class="team-card-item__nature-tag"><i data-lucide="sparkle"></i> ${capitalize(slot.nature)}</div>`
        : "";

      const itemTag = slot.item
        ? `<div class="team-card-item__item-tag">${renderItemIconHTML(slot.item, { size: 12 })} ${getItemDisplayName(slot.item, locale)}</div>`
        : "";

      return `
        <div class="team-card-item" style="--item-glow:${glowColor};">
          <div class="team-card-item__header">
            <span class="team-card-item__dex">${dexNumber(p.id)}</span>
            <div class="team-card-item__types">${typeBadges}</div>
          </div>
          <div class="team-card-item__sprite-wrap">
            <img src="${sprite}" alt="${p.name}" loading="lazy" />
          </div>
          <h4 class="team-card-item__name">${p.name}</h4>
          <div class="team-card-item__tags-row">
            ${natureTag}
            ${itemTag}
          </div>
          <div class="team-card-item__moves">${movesList || '<span class="team-card-item__no-moves">Sin ataques</span>'}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="team-card-graphic">
      <div class="team-card-graphic__header">
        <div class="team-card-graphic__brand">
          <img src="/favicon.png" alt="PokeForge Logo" width="32" height="32" />
          <span class="team-card-graphic__title">POKEFORGE</span>
        </div>
        <span class="team-card-graphic__subtitle">Alineación Oficial de Equipo</span>
      </div>

      <div class="team-card-graphic__grid">
        ${slotItemsHtml}
      </div>

      <div class="team-card-graphic__footer">
        <span>pokeforges.netlify.app</span>
        <span>${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
    </div>
  `;
}

export async function downloadTeamCardCanvas(previewContainerEl: HTMLElement): Promise<void> {
  const cardGraphicEl = previewContainerEl.querySelector<HTMLElement>(".team-card-graphic");
  if (!cardGraphicEl) {
    toast.error("No se encontró el diseño de la tarjeta.");
    return;
  }

  try {
    toast.info("Generando tarjeta PNG en alta definición...");
    const dataUrl = await toPng(cardGraphicEl, {
      quality: 0.98,
      pixelRatio: 2,
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = "pokeforge-team.png";
    link.href = dataUrl;
    link.click();
    toast.success("¡Tarjeta de equipo descargada como PNG!");
  } catch (err) {
    console.error("Error al exportar tarjeta:", err);
    toast.error("No se pudo generar la imagen del equipo.");
  }
}
