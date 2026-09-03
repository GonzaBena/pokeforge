import { createSyncPayload, encodeSyncPayload, decodeSyncPayload, applySyncPayload, type SyncPayload } from "./sync";
import { CAPTURED_CHANGED_EVENT, TEAM_CHANGED_EVENT, GAME_CHANGED_EVENT } from "./storage";

export const CLOUD_STATUS_EVENT = "poketeam:cloud-status";

const CLOUD_CODE_KEY = "poketeam:cloud_code";
const CLOUD_SECRET_KEY = "poketeam:cloud_secret";
const CLOUD_LAST_SYNC_KEY = "poketeam:cloud_last_sync";

export interface CloudState {
  isLinked: boolean;
  code: string | null;
  secretKey: string | null;
  lastSync: number | null;
  isSyncing: boolean;
}

let isSyncing = false;
let syncDebounceTimer: number | null = null;
let isInitialized = false;

export function getCloudState(): CloudState {
  if (typeof localStorage === "undefined") {
    return { isLinked: false, code: null, secretKey: null, lastSync: null, isSyncing: false };
  }

  const code = localStorage.getItem(CLOUD_CODE_KEY);
  const secretKey = localStorage.getItem(CLOUD_SECRET_KEY);
  const lastSyncStr = localStorage.getItem(CLOUD_LAST_SYNC_KEY);
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : null;

  return {
    isLinked: Boolean(code),
    code,
    secretKey,
    lastSync,
    isSyncing,
  };
}

export function notifyStatusChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLOUD_STATUS_EVENT, { detail: getCloudState() }));
}

/**
 * Consulta la bóveda en la DB y decodifica su payload sin aplicarlo localmente.
 */
export async function fetchCloudVault(
  code: string
): Promise<{ success: boolean; payload?: SyncPayload; updatedAt?: number; error?: string }> {
  const cleanCode = code.toUpperCase().trim();
  if (!cleanCode) return { success: false, error: "Código requerido" };

  try {
    const res = await fetch(`/api/vault?code=${encodeURIComponent(cleanCode)}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.message || "Bóveda no encontrada" };
    }

    const payload = await decodeSyncPayload(data.payload);
    return { success: true, payload, updatedAt: data.updatedAt };
  } catch {
    return { success: false, error: "Error de conexión con el servidor" };
  }
}

/**
 * Asigna o actualiza la clave secreta en el dispositivo local para habilitar permisos de escritura.
 */
export function setCloudSecretKey(secretKey: string): boolean {
  const cleanKey = secretKey.trim();
  if (!cleanKey) return false;
  localStorage.setItem(CLOUD_SECRET_KEY, cleanKey);
  notifyStatusChange();
  return true;
}

/**
 * Crea una nueva bóveda en la DB con el estado local actual.
 */
export async function createCloudVault(): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    isSyncing = true;
    notifyStatusChange();

    const localPayload = createSyncPayload();
    const token = await encodeSyncPayload(localPayload);

    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: token }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || "Error al crear bóveda en la nube" };
    }

    localStorage.setItem(CLOUD_CODE_KEY, data.code);
    localStorage.setItem(CLOUD_SECRET_KEY, data.secretKey);
    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));

    return { success: true, code: data.code };
  } catch (err) {
    return { success: false, error: "Error de conexión con el servidor" };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Se une a una bóveda existente mediante su código de 6 caracteres.
 */
export async function joinCloudVault(
  code: string,
  secretKey?: string,
  mode: "merge" | "replace" = "merge"
): Promise<{ success: boolean; payload?: SyncPayload; error?: string }> {
  const cleanCode = code.toUpperCase().trim();
  if (!cleanCode) return { success: false, error: "Código requerido" };

  try {
    isSyncing = true;
    notifyStatusChange();

    const res = await fetch(`/api/vault?code=${encodeURIComponent(cleanCode)}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.message || "Bóveda no encontrada" };
    }

    const payload = await decodeSyncPayload(data.payload);
    applySyncPayload(payload, mode);

    localStorage.setItem(CLOUD_CODE_KEY, cleanCode);
    if (secretKey) {
      localStorage.setItem(CLOUD_SECRET_KEY, secretKey.trim());
    }
    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));

    return { success: true, payload };
  } catch {
    return { success: false, error: "Error al sincronizar con la nube" };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Envía los cambios locales a la bóveda en la DB.
 */
export async function syncToCloudNow(): Promise<{ success: boolean; error?: string }> {
  const state = getCloudState();
  if (!state.isLinked || !state.code) {
    return { success: false, error: "Dispositivo no vinculado a la nube" };
  }
  if (!state.secretKey) {
    return {
      success: false,
      error: "Dispositivo en modo Solo Lectura. Escaneá el código QR desde tu PC para habilitar permisos de escritura.",
    };
  }

  try {
    isSyncing = true;
    notifyStatusChange();

    const localPayload = createSyncPayload();
    const token = await encodeSyncPayload(localPayload);

    const res = await fetch("/api/vault", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: state.code,
        secretKey: state.secretKey,
        payload: token,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || "Error al actualizar nube" };
    }

    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));
    return { success: true };
  } catch {
    return { success: false, error: "Sin conexión a internet" };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Consulta la nube para comprobar si hay actualizaciones más recientes.
 */
export async function fetchFromCloud(): Promise<void> {
  const state = getCloudState();
  if (!state.isLinked || !state.code) return;

  try {
    const res = await fetch(`/api/vault?code=${encodeURIComponent(state.code)}`);
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !data.updatedAt) return;

    const localLastSync = state.lastSync || 0;
    // Si la nube tiene cambios más nuevos por más de 1.5s
    if (data.updatedAt > localLastSync + 1500) {
      const payload = await decodeSyncPayload(data.payload);
      applySyncPayload(payload, "merge");
      localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));
      notifyStatusChange();
    }
  } catch {
    // Ignorar si está offline
  }
}

/**
 * Programa una sincronización con debounce de 1.5s.
 */
export function scheduleAutoSync(): void {
  const state = getCloudState();
  if (!state.isLinked || !state.secretKey) return;

  if (syncDebounceTimer) {
    window.clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = window.setTimeout(() => {
    syncToCloudNow();
  }, 1500);
}

/**
 * Desvincula el dispositivo local sin borrar los datos en la DB.
 */
export function unlinkCloudVault(): void {
  localStorage.removeItem(CLOUD_CODE_KEY);
  localStorage.removeItem(CLOUD_SECRET_KEY);
  localStorage.removeItem(CLOUD_LAST_SYNC_KEY);
  notifyStatusChange();
}

/**
 * Elimina la bóveda de la DB permanentemente (DELETE).
 */
export async function deleteCloudVault(): Promise<{ success: boolean; error?: string }> {
  const state = getCloudState();
  if (!state.isLinked || !state.code || !state.secretKey) {
    unlinkCloudVault();
    return { success: true };
  }

  try {
    isSyncing = true;
    notifyStatusChange();

    const res = await fetch("/api/vault", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: state.code,
        secretKey: state.secretKey,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || "Error al eliminar bóveda" };
    }

    unlinkCloudVault();
    return { success: true };
  } catch {
    return { success: false, error: "Error al comunicar con la DB" };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Inicializa los listeners globales para auto-sync en el cliente.
 */
export function initCloudSyncClient(): void {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  window.addEventListener(CAPTURED_CHANGED_EVENT, scheduleAutoSync);
  window.addEventListener(TEAM_CHANGED_EVENT, scheduleAutoSync);
  window.addEventListener(GAME_CHANGED_EVENT, scheduleAutoSync);

  window.addEventListener("focus", fetchFromCloud);
  window.addEventListener("online", () => {
    fetchFromCloud();
    syncToCloudNow();
  });
}
