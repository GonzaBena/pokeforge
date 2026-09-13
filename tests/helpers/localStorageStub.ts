class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

/**
 * Installs a fresh in-memory localStorage + a real EventTarget as `window`
 * on globalThis, so storage.ts/sync.ts (which read the bare `localStorage`
 * and `window` globals) work under node:test without jsdom.
 */
export function installStorageStub(): { restore: () => void } {
  const previousLocalStorage = globalThis.localStorage
  const previousWindow = globalThis.window

  globalThis.localStorage = new MemoryStorage()
  globalThis.window = new EventTarget() as unknown as Window & typeof globalThis

  return {
    restore(): void {
      globalThis.localStorage = previousLocalStorage
      globalThis.window = previousWindow
    },
  }
}
