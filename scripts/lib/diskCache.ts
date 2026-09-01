import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CACHE_ROOT = path.resolve(import.meta.dirname, "..", ".cache");

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function readCache<T>(namespace: string, key: string): Promise<T | null> {
  const file = path.join(CACHE_ROOT, namespace, `${key}.json`);
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCache<T>(namespace: string, key: string, data: T): Promise<void> {
  const dir = path.join(CACHE_ROOT, namespace);
  await ensureDir(dir);
  const file = path.join(dir, `${key}.json`);
  await writeFile(file, JSON.stringify(data), "utf-8");
}

export async function cachedFetch<T>(
  namespace: string,
  key: string,
  fetcher: () => Promise<T>,
  force = false,
): Promise<T> {
  if (!force) {
    const cached = await readCache<T>(namespace, key);
    if (cached !== null) return cached;
  }

  const data = await fetcher();
  await writeCache(namespace, key, data);
  return data;
}
