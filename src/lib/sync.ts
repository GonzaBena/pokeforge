import QRCode from "qrcode";
import {
  getCapturedIds,
  getTeam,
  setTeam,
  getPokemonOverrides,
  setPokemonOverrides,
  getSelectedGame,
  setSelectedGame,
  type PokemonOverrides,
  CAPTURED_CHANGED_EVENT,
} from "./storage";
import type { TeamState } from "./types";

export interface SyncPayload {
  v: 1;
  timestamp: number;
  capturedBitset: string; // Base64 129-byte bitset for 1025 pokemon
  team: TeamState;
  overrides?: Record<number, PokemonOverrides>;
  game?: string;
}

export interface SyncSummary {
  timestamp: number;
  incomingCapturesCount: number;
  currentCapturesCount: number;
  teamSlotsCount: number;
  game?: string;
}

/**
 * Encodes a Set of Pokemon IDs (1..1025) into a compact 129-byte base64 bitset.
 */
export function encodeCapturedIds(ids: Set<number>): string {
  const bytes = new Uint8Array(129);
  for (const id of ids) {
    if (id >= 1 && id <= 1025) {
      const idx = id - 1;
      bytes[idx >> 3] |= 1 << (idx & 7);
    }
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a 129-byte base64 bitset into a Set of Pokemon IDs (1..1025).
 */
export function decodeCapturedIds(base64: string): Set<number> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const set = new Set<number>();
  for (let i = 0; i < bytes.length * 8; i++) {
    if (i >= 1025) break;
    if (bytes[i >> 3] & (1 << (i & 7))) {
      set.add(i + 1);
    }
  }
  return set;
}

/**
 * Collects all per-pokemon overrides from localStorage.
 */
export function getAllOverrides(): Record<number, PokemonOverrides> {
  const overrides: Record<number, PokemonOverrides> = {};
  if (typeof localStorage === "undefined") return overrides;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("poketeam:pokemon-overrides:")) {
        const id = parseInt(key.replace("poketeam:pokemon-overrides:", ""), 10);
        if (!isNaN(id)) {
          overrides[id] = getPokemonOverrides(id);
        }
      }
    }
  } catch {}
  return overrides;
}

/**
 * Gathers the current local state into a SyncPayload.
 */
export function createSyncPayload(): SyncPayload {
  const captured = getCapturedIds();
  return {
    v: 1,
    timestamp: Date.now(),
    capturedBitset: encodeCapturedIds(captured),
    team: getTeam(),
    overrides: getAllOverrides(),
    game: getSelectedGame(),
  };
}

/**
 * Compresses the payload into a URL-safe Base64 token using Deflate.
 */
export async function encodeSyncPayload(payload: SyncPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);

  if (typeof CompressionStream !== "undefined") {
    try {
      const stream = new Blob([jsonStr]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream("deflate"));
      const buffer = await new Response(compressedStream).arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      return "z." + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch {
      // fallback
    }
  }

  // Fallback: raw URL-safe Base64
  const bytes = new TextEncoder().encode(jsonStr);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "r." + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decompresses and parses a URL-safe Base64 token into a SyncPayload.
 */
export async function decodeSyncPayload(token: string): Promise<SyncPayload> {
  const isCompressed = token.startsWith("z.");
  const cleanToken = token.startsWith("z.") || token.startsWith("r.") ? token.slice(2) : token;

  let base64 = cleanToken.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";

  const binary = atob(base64);
  const u8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    u8[i] = binary.charCodeAt(i);
  }

  if (isCompressed && typeof DecompressionStream !== "undefined") {
    const inStream = new Blob([u8]).stream();
    const decompressedStream = inStream.pipeThrough(new DecompressionStream("deflate"));
    const text = await new Response(decompressedStream).text();
    return JSON.parse(text) as SyncPayload;
  }

  const decodedStr = new TextDecoder().decode(u8);
  return JSON.parse(decodedStr) as SyncPayload;
}

/**
 * Builds the full URL for synchronization: https://.../sync/#d=<token>
 */
export async function generateSyncUrl(origin?: string): Promise<string> {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const payload = createSyncPayload();
  const token = await encodeSyncPayload(payload);
  return `${base}/sync/#d=${token}`;
}

export interface CloudPairingInfo {
  code: string;
  secretKey?: string;
}

/**
 * Parses cloud vault pairing credentials from URL hash or raw string: #vault=PK-XXXX&key=YYYY
 */
export function parseCloudPairingFromHash(hashStr?: string): CloudPairingInfo | null {
  const hash = hashStr || (typeof window !== "undefined" ? window.location.hash : "");
  if (!hash) return null;

  const codeMatch = hash.match(/[#&]vault=([^&]+)/i);
  if (!codeMatch || !codeMatch[1]) return null;

  const keyMatch = hash.match(/[#&]key=([^&]+)/i);
  return {
    code: decodeURIComponent(codeMatch[1]).toUpperCase().trim(),
    secretKey: keyMatch ? decodeURIComponent(keyMatch[1]).trim() : undefined,
  };
}

/**
 * Generates a full pairing URL for cloud sync: https://.../sync/#vault=CODE&key=SECRET
 */
export function generateCloudPairingUrl(
  code: string,
  secretKey?: string,
  origin?: string,
  locale?: string
): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const pathPrefix = locale && locale !== "en" ? `/${locale}` : "";
  let url = `${base}${pathPrefix}/sync/#vault=${encodeURIComponent(code)}`;
  if (secretKey) {
    url += `&key=${encodeURIComponent(secretKey)}`;
  }
  return url;
}

/**
 * Parses the sync token from location.hash or a raw string.
 */
export async function parseSyncFromHash(hashStr?: string): Promise<SyncPayload | null> {
  const hash = hashStr || (typeof window !== "undefined" ? window.location.hash : "");
  if (!hash) return null;

  const match = hash.match(/[#&]d=([^&]+)/);
  if (!match || !match[1]) return null;

  try {
    const payload = await decodeSyncPayload(match[1]);
    if (payload && payload.v === 1) {
      return payload;
    }
  } catch (err) {
    console.error("Error decoding sync payload:", err);
  }
  return null;
}

/**
 * Applies a SyncPayload to local storage according to the selected mode.
 */
export function applySyncPayload(
  payload: SyncPayload,
  mode: "merge" | "replace"
): { addedCaptures: number; totalCaptures: number } {
  const incomingCaptures = decodeCapturedIds(payload.capturedBitset);
  const currentCaptures = getCapturedIds();

  let finalCaptures: Set<number>;
  let addedCount = 0;

  if (mode === "merge") {
    finalCaptures = new Set(currentCaptures);
    for (const id of incomingCaptures) {
      if (!finalCaptures.has(id)) {
        finalCaptures.add(id);
        addedCount++;
      }
    }
  } else {
    finalCaptures = incomingCaptures;
    addedCount = incomingCaptures.size;
  }

  // Save captured
  try {
    localStorage.setItem("poketeam:captured", JSON.stringify([...finalCaptures]));
    window.dispatchEvent(new CustomEvent(CAPTURED_CHANGED_EVENT, { detail: { ids: finalCaptures } }));
  } catch {}

  // Save team
  if (payload.team && Array.isArray(payload.team.slots)) {
    setTeam(payload.team);
  }

  // Save overrides
  if (payload.overrides) {
    for (const [idStr, override] of Object.entries(payload.overrides)) {
      const id = parseInt(idStr, 10);
      if (!isNaN(id)) {
        setPokemonOverrides(id, override);
      }
    }
  }

  // Save game preference if set
  if (payload.game) {
    setSelectedGame(payload.game);
  }

  return { addedCaptures: addedCount, totalCaptures: finalCaptures.size };
}

/**
 * Renders a QR code to a canvas element.
 */
export async function renderQrCode(canvas: HTMLCanvasElement, text: string): Promise<void> {
  await QRCode.toCanvas(canvas, text, {
    width: 240,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Exports a full JSON backup file for manual downloads.
 */
export function exportBackupFile(): void {
  const payload = createSyncPayload();
  const captured = [...decodeCapturedIds(payload.capturedBitset)];
  const exportData = {
    app: "PokeForge",
    version: 1,
    exportDate: new Date().toISOString(),
    totalCaptured: captured.length,
    captured,
    team: payload.team,
    overrides: payload.overrides,
    game: payload.game,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `pokeforge-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a backup from an uploaded JSON file.
 */
export async function importBackupFile(
  file: File,
  mode: "merge" | "replace"
): Promise<{ addedCaptures: number; totalCaptures: number }> {
  const text = await file.text();
  const raw = JSON.parse(text);

  let bitset: string;
  if (typeof raw.capturedBitset === "string") {
    bitset = raw.capturedBitset;
  } else if (Array.isArray(raw.captured)) {
    bitset = encodeCapturedIds(new Set(raw.captured));
  } else {
    throw new Error("Formato de respaldo no válido");
  }

  const payload: SyncPayload = {
    v: 1,
    timestamp: raw.exportDate ? new Date(raw.exportDate).getTime() : Date.now(),
    capturedBitset: bitset,
    team: raw.team,
    overrides: raw.overrides || {},
    game: raw.game,
  };

  return applySyncPayload(payload, mode);
}
