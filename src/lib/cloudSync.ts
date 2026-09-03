import { createSyncPayload, encodeSyncPayload, decodeSyncPayload, applySyncPayload, type SyncPayload } from "./sync";
import { CAPTURED_CHANGED_EVENT, TEAM_CHANGED_EVENT, GAME_CHANGED_EVENT } from "./storage";
import { getCurrentLocale, getTranslations } from "./i18n/translations";
import { toast } from "./toast";

export const CLOUD_STATUS_EVENT = "poketeam:cloud-status";

const CLOUD_CODE_KEY = "poketeam:cloud_code";
const CLOUD_SECRET_KEY = "poketeam:cloud_secret";
const CLOUD_LAST_SYNC_KEY = "poketeam:cloud_last_sync";

export type CloudSyncStatus = "unlinked" | "syncing" | "synced" | "offline" | "error";

export interface CloudState {
  isLinked: boolean;
  code: string | null;
  secretKey: string | null;
  lastSync: number | null;
  isSyncing: boolean;
  status: CloudSyncStatus;
  lastError: string | null;
}

let isSyncing = false;
let syncDebounceTimer: number | null = null;
let isInitialized = false;
let isApplyingRemoteUpdate = false;
let lastSyncError: string | null = null;
let syncWorker: Worker | null = null;
let fallbackIntervalTimer: number | null = null;

// Intervalo de comprobación en segundo plano (5 minutos)
const SYNC_WORKER_INTERVAL = 5 * 60 * 1000;

function getSyncRemoteUpdatedText(): string {
  try {
    const locale = getCurrentLocale();
    const t = getTranslations(locale);
    return t.nav.cloudRemoteUpdated || "Datos actualizados desde la nube";
  } catch {
    return "Datos actualizados desde la nube";
  }
}

export function getCloudState(): CloudState {
  if (typeof localStorage === "undefined") {
    return {
      isLinked: false,
      code: null,
      secretKey: null,
      lastSync: null,
      isSyncing: false,
      status: "unlinked",
      lastError: null,
    };
  }

  const code = localStorage.getItem(CLOUD_CODE_KEY);
  const secretKey = localStorage.getItem(CLOUD_SECRET_KEY);
  const lastSyncStr = localStorage.getItem(CLOUD_LAST_SYNC_KEY);
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : null;

  let status: CloudSyncStatus = "unlinked";
  if (code) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      status = "offline";
    } else if (isSyncing) {
      status = "syncing";
    } else if (lastSyncError) {
      status = "error";
    } else {
      status = "synced";
    }
  }

  return {
    isLinked: Boolean(code),
    code,
    secretKey,
    lastSync,
    isSyncing,
    status,
    lastError: lastSyncError,
  };
}

export function notifyStatusChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLOUD_STATUS_EVENT, { detail: getCloudState() }));
}

/**
 * Inicia el Web Worker para verificar cambios remotos en segundo plano cada ~5 minutos.
 */
function initSyncWorker(): void {
  if (typeof window === "undefined") return;

  const state = getCloudState();
  if (!state.isLinked || !state.code) {
    stopSyncWorker();
    return;
  }

  if (typeof Worker !== "undefined") {
    if (!syncWorker) {
      try {
        syncWorker = new Worker("/sync-worker.js");
        syncWorker.onmessage = async (e: MessageEvent) => {
          const data = e.data;
          if (!data) return;

          if (data.type === "VAULT_CHECK_RESULT") {
            if (data.isOffline) {
              lastSyncError = null;
              notifyStatusChange();
              return;
            }

            if (!data.success) {
              lastSyncError = data.error || "Error al comprobar cambios en la nube";
              notifyStatusChange();
              return;
            }

            lastSyncError = null;
            const remoteUpdatedAt = Number(data.updatedAt) || 0;
            const currentSyncState = getCloudState();
            const localLastSync = currentSyncState.lastSync || 0;

            // Si la nube tiene cambios más nuevos por más de 1.5s
            if (remoteUpdatedAt > localLastSync + 1500) {
              try {
                isApplyingRemoteUpdate = true;
                const payload = await decodeSyncPayload(data.payload);
                applySyncPayload(payload, "replace");
                localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(remoteUpdatedAt));
                toast.info(getSyncRemoteUpdatedText());
              } catch (err) {
                console.error("Error al aplicar actualización remota:", err);
              } finally {
                isApplyingRemoteUpdate = false;
                notifyStatusChange();
              }
            } else {
              notifyStatusChange();
            }
          }
        };

        syncWorker.onerror = (err) => {
          console.warn("Sync Worker warning:", err);
        };
      } catch (err) {
        console.warn("No se pudo iniciar Web Worker, usando temporizador estándar:", err);
        startFallbackTimer(state.code);
        return;
      }
    }

    syncWorker.postMessage({
      action: "START",
      code: state.code,
      intervalMs: SYNC_WORKER_INTERVAL,
    });
  } else {
    startFallbackTimer(state.code);
  }
}

function stopSyncWorker(): void {
  if (syncWorker) {
    syncWorker.postMessage({ action: "STOP" });
    syncWorker.terminate();
    syncWorker = null;
  }
  if (fallbackIntervalTimer) {
    window.clearInterval(fallbackIntervalTimer);
    fallbackIntervalTimer = null;
  }
}

function startFallbackTimer(code: string): void {
  if (fallbackIntervalTimer) {
    window.clearInterval(fallbackIntervalTimer);
  }
  fallbackIntervalTimer = window.setInterval(() => {
    fetchFromCloud();
  }, SYNC_WORKER_INTERVAL);
}

/**
 * Solicita al Web Worker una verificación forzada inmediata.
 */
export function pingSyncWorkerCheck(): void {
  const state = getCloudState();
  if (!state.isLinked || !state.code) return;

  if (syncWorker) {
    syncWorker.postMessage({ action: "CHECK_NOW", code: state.code });
  } else {
    fetchFromCloud();
  }
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
    const res = await fetch(`/api/vault?code=${encodeURIComponent(cleanCode)}&_t=${Date.now()}`, {
      cache: "no-store",
    });
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
    lastSyncError = null;
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
      lastSyncError = data.message || "Error al crear bóveda en la nube";
      return { success: false, error: lastSyncError ?? undefined };
    }

    localStorage.setItem(CLOUD_CODE_KEY, data.code);
    localStorage.setItem(CLOUD_SECRET_KEY, data.secretKey);
    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));
    lastSyncError = null;

    initSyncWorker();
    return { success: true, code: data.code };
  } catch (err) {
    lastSyncError = "Error de conexión con el servidor";
    return { success: false, error: lastSyncError };
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
  mode: "merge" | "replace" = "replace"
): Promise<{ success: boolean; payload?: SyncPayload; error?: string }> {
  const cleanCode = code.toUpperCase().trim();
  if (!cleanCode) return { success: false, error: "Código requerido" };

  try {
    isSyncing = true;
    lastSyncError = null;
    notifyStatusChange();

    const res = await fetch(`/api/vault?code=${encodeURIComponent(cleanCode)}&_t=${Date.now()}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      lastSyncError = data.message || "Bóveda no encontrada";
      return { success: false, error: lastSyncError ?? undefined };
    }

    const payload = await decodeSyncPayload(data.payload);
    isApplyingRemoteUpdate = true;
    try {
      applySyncPayload(payload, mode);
    } finally {
      isApplyingRemoteUpdate = false;
    }

    localStorage.setItem(CLOUD_CODE_KEY, cleanCode);
    if (secretKey) {
      localStorage.setItem(CLOUD_SECRET_KEY, secretKey.trim());
    }
    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));
    lastSyncError = null;

    initSyncWorker();
    return { success: true, payload };
  } catch {
    lastSyncError = "Error al sincronizar con la nube";
    return { success: false, error: lastSyncError };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Envía los cambios locales a la bóveda en la DB (PUT /api/vault).
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
    lastSyncError = null;
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
      lastSyncError = data.message || "Error al actualizar nube";
      return { success: false, error: lastSyncError ?? undefined };
    }

    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));
    lastSyncError = null;
    return { success: true };
  } catch {
    lastSyncError = "Sin conexión a internet";
    return { success: false, error: lastSyncError };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Consulta la nube para comprobar si hay actualizaciones más recientes (GET /api/vault).
 */
export async function fetchFromCloud(): Promise<void> {
  const state = getCloudState();
  if (!state.isLinked || !state.code) return;

  try {
    const res = await fetch(`/api/vault?code=${encodeURIComponent(state.code)}&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !data.updatedAt) return;

    const localLastSync = state.lastSync || 0;
    // Si la nube tiene cambios más nuevos por más de 1.5s
    if (data.updatedAt > localLastSync + 1500) {
      isApplyingRemoteUpdate = true;
      try {
        const payload = await decodeSyncPayload(data.payload);
        applySyncPayload(payload, "replace");
        localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(data.updatedAt));
        lastSyncError = null;
        toast.info(getSyncRemoteUpdatedText());
      } finally {
        isApplyingRemoteUpdate = false;
        notifyStatusChange();
      }
    } else {
      lastSyncError = null;
      notifyStatusChange();
    }
  } catch {
    // Modo offline silencioso
  }
}

/**
 * Programa una sincronización con debounce de 1.5s ante cualquier cambio local.
 * Muestra inmediatamente el estado de "Guardando..." estilo Google Docs.
 */
export function scheduleAutoSync(): void {
  if (isApplyingRemoteUpdate) return;
  const state = getCloudState();
  if (!state.isLinked || !state.secretKey) return;

  // Feedback visual instantáneo: marcando como guardando/syncing
  isSyncing = true;
  lastSyncError = null;
  notifyStatusChange();

  if (syncDebounceTimer) {
    window.clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = window.setTimeout(async () => {
    await syncToCloudNow();
  }, 1500);
}

/**
 * Desvincula el dispositivo local sin borrar los datos en la DB.
 */
export function unlinkCloudVault(): void {
  stopSyncWorker();
  localStorage.removeItem(CLOUD_CODE_KEY);
  localStorage.removeItem(CLOUD_SECRET_KEY);
  localStorage.removeItem(CLOUD_LAST_SYNC_KEY);
  lastSyncError = null;
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
    lastSyncError = null;
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
      lastSyncError = data.message || "Error al eliminar bóveda";
      return { success: false, error: lastSyncError ?? undefined };
    }

    unlinkCloudVault();
    return { success: true };
  } catch {
    lastSyncError = "Error al comunicar con la DB";
    return { success: false, error: lastSyncError ?? undefined };
  } finally {
    isSyncing = false;
    notifyStatusChange();
  }
}

/**
 * Inicializa los listeners globales para auto-sync y Web Worker en el cliente.
 */
export function initCloudSyncClient(): void {
  if (typeof window === "undefined") return;

  if (isInitialized) {
    initSyncWorker();
    fetchFromCloud();
    return;
  }
  isInitialized = true;

  window.addEventListener(CAPTURED_CHANGED_EVENT, scheduleAutoSync);
  window.addEventListener(TEAM_CHANGED_EVENT, scheduleAutoSync);
  window.addEventListener(GAME_CHANGED_EVENT, scheduleAutoSync);

  // Al volver a la pestaña, comprobar si hubo cambios en otros dispositivos
  window.addEventListener("focus", () => {
    pingSyncWorkerCheck();
  });

  window.addEventListener("online", () => {
    lastSyncError = null;
    notifyStatusChange();
    pingSyncWorkerCheck();
    syncToCloudNow();
  });

  window.addEventListener("offline", () => {
    notifyStatusChange();
  });

  initSyncWorker();
  fetchFromCloud();
}
