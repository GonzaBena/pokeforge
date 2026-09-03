/**
 * PokeForge Background Sync Web Worker
 * Checks the database every ~5 minutes for remote updates.
 */

let pollIntervalId = null;
let currentCode = null;
let currentIntervalMs = 5 * 60 * 1000; // 5 minutos por defecto

async function checkVault(code) {
  if (!code) return;
  try {
    const res = await fetch(`/api/vault?code=${encodeURIComponent(code)}&_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!res.ok) {
      self.postMessage({
        type: 'VAULT_CHECK_RESULT',
        success: false,
        status: res.status,
        checkedAt: Date.now()
      });
      return;
    }

    const data = await res.json();
    if (data.success && data.updatedAt) {
      self.postMessage({
        type: 'VAULT_CHECK_RESULT',
        success: true,
        code: data.code,
        payload: data.payload,
        updatedAt: data.updatedAt,
        checkedAt: Date.now()
      });
    } else {
      self.postMessage({
        type: 'VAULT_CHECK_RESULT',
        success: false,
        error: data.message || 'Error en respuesta de bóveda',
        checkedAt: Date.now()
      });
    }
  } catch (err) {
    self.postMessage({
      type: 'VAULT_CHECK_RESULT',
      success: false,
      isOffline: true,
      error: String(err),
      checkedAt: Date.now()
    });
  }
}

function startPolling(code, intervalMs) {
  stopPolling();
  currentCode = code;
  if (intervalMs && intervalMs > 0) {
    currentIntervalMs = intervalMs;
  }

  // Comprobación periódica cada intervalMs (~5 min)
  pollIntervalId = setInterval(() => {
    if (currentCode) {
      checkVault(currentCode);
    }
  }, currentIntervalMs);
}

function stopPolling() {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  currentCode = null;
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.action) return;

  switch (data.action) {
    case 'START':
      startPolling(data.code, data.intervalMs);
      break;
    case 'STOP':
      stopPolling();
      break;
    case 'CHECK_NOW':
      if (data.code || currentCode) {
        checkVault(data.code || currentCode);
      }
      break;
    case 'CONFIG':
      if (data.intervalMs && data.intervalMs > 0) {
        currentIntervalMs = data.intervalMs;
        if (currentCode) {
          startPolling(currentCode, currentIntervalMs);
        }
      }
      break;
  }
});
