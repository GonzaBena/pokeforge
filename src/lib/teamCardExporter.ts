import type { Pokemon, TeamState } from "./types";
import { typeColor } from "./typeColors";
import { toast } from "./toast";

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

    const lines: string[] = [];
    lines.push(`${capitalize(p.name)}`);
    lines.push(`Types: ${p.types.map(capitalize).join(" / ")}`);

    if (slot.moves && slot.moves.some(Boolean)) {
      for (const m of slot.moves) {
        if (m) lines.push(`- ${m.split("-").map(capitalize).join(" ")}`);
      }
    }
    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n");
}

export function renderTeamCardHTML(team: TeamState, pokemonMap: Map<number, Pokemon>): string {
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
        .map((m) => `<span class="team-card-item__move-tag">${m!.split("-").map(capitalize).join(" ")}</span>`)
        .join("");

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
          <div class="team-card-item__moves">${movesList || '<span class="team-card-item__no-moves">Sin ataques</span>'}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="team-card-graphic">
      <div class="team-card-graphic__header">
        <div class="team-card-graphic__brand">
          <img src="/favicon.png" alt="PokeForge Logo" width="28" height="28" />
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

export async function downloadTeamCardCanvas(team: TeamState, pokemonMap: Map<number, Pokemon>): Promise<void> {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 670;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#101014");
  grad.addColorStop(0.5, "#181822");
  grad.addColorStop(1, "#0d0d12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Red Ambient Glow at top
  const radial = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 450);
  radial.addColorStop(0, "rgba(239, 68, 68, 0.25)");
  radial.addColorStop(1, "rgba(16, 16, 20, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Header Title
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("POKEFORGE", 50, 60);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "600 16px sans-serif";
  ctx.fillText("ALINEACIÓN Y ESTRATEGIA DE EQUIPO", 270, 58);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 85);
  ctx.lineTo(width - 50, 85);
  ctx.stroke();

  // Load and draw sprites
  const slots = team.slots;
  const activeSlots = slots.filter((s) => s.pokemonId !== null);

  if (activeSlots.length === 0) {
    ctx.fillStyle = "#71717a";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Equipo Vacío - Ningún Pokémon Seleccionado", width / 2, height / 2);
  } else {
    const cols = 3;
    const cardW = 340;
    const cardH = 240;
    const gapX = 30;
    const gapY = 24;
    const startX = (width - (cols * cardW + (cols - 1) * gapX)) / 2;
    const startY = 115;

    for (let i = 0; i < slots.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const slot = slots[i];

      // Card Background
      ctx.fillStyle = "rgba(24, 24, 32, 0.85)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 14);
      ctx.fill();
      ctx.stroke();

      if (slot && slot.pokemonId) {
        const p = pokemonMap.get(slot.pokemonId);
        if (p) {
          const mainType = p.types[0] ?? "normal";
          const glow = typeColor(mainType);

          // Top Type Border Accent
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.roundRect(x, y, cardW, 4, [14, 14, 0, 0]);
          ctx.fill();

          // Dex & Name
          ctx.fillStyle = "#71717a";
          ctx.font = "bold 13px monospace";
          ctx.textAlign = "left";
          ctx.fillText(dexNumber(p.id), x + 16, y + 28);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(capitalize(p.name), x + 16, y + 54);

          // Type Badges text
          ctx.font = "600 12px sans-serif";
          ctx.fillStyle = glow;
          ctx.fillText(p.types.map((t) => t.toUpperCase()).join(" / "), x + 16, y + 74);

          // Moves List
          const moves = (slot.moves ?? []).filter(Boolean);
          ctx.fillStyle = "#a1a1aa";
          ctx.font = "12px sans-serif";
          let moveY = y + 106;
          for (const m of moves.slice(0, 4)) {
            ctx.fillText(`• ${m!.split("-").map(capitalize).join(" ")}`, x + 16, moveY);
            moveY += 20;
          }

          // Sprite Image
          const spriteUrl = p.sprites.officialArtwork ?? p.sprites.default ?? "";
          if (spriteUrl) {
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src = spriteUrl;
              await new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              });
              ctx.drawImage(img, x + cardW - 135, y + 45, 120, 120);
            } catch (err) {
              // fallback if sprite image fails
            }
          }
        }
      } else {
        // Empty slot text
        ctx.fillStyle = "#52525b";
        ctx.font = "600 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Slot ${i + 1} (Vacío)`, x + cardW / 2, y + cardH / 2);
      }
    }
  }

  // Footer
  ctx.fillStyle = "#52525b";
  ctx.font = "600 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("pokeforges.netlify.app", 50, height - 25);

  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }), width - 50, height - 25);

  // Trigger Download
  const link = document.createElement("a");
  link.download = "pokeforge-team.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
  toast.success("¡Tarjeta de equipo descargada como PNG!");
}
