const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter ? Number(retryAfter) * 1000 : BASE_DELAY_MS * 2 ** attempt;
        await sleep(delay);
        continue;
      }

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} for ${url}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BASE_DELAY_MS * 2 ** attempt);
      }
    }
  }

  throw new Error(`Failed to fetch ${url} after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`);
}
