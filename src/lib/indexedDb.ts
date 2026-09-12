import type { Pokemon } from './types'

const DB_NAME = 'pokeforge-local-db'
const DB_VERSION = 1

export const STORES = {
  CHUNKS: 'pokedex_chunks',
  METADATA: 'metadata',
  FAVORITES: 'favorites',
  TEAMS: 'teams',
  SEARCH_HISTORY: 'search_history',
} as const

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase | null> | null = null

/**
 * Checks if IndexedDB is available in the current environment.
 */
export function isIndexedDbSupported(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.indexedDB !== 'undefined' &&
      window.indexedDB !== null
    )
  } catch {
    return false
  }
}

/**
 * Opens or initializes the local IndexedDB database.
 */
export async function getDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbSupported()) return null
  if (dbInstance) return dbInstance
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORES.CHUNKS)) {
          db.createObjectStore(STORES.CHUNKS)
        }
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA)
        }
        if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
          const favStore = db.createObjectStore(STORES.FAVORITES, { keyPath: 'id' })
          favStore.createIndex('addedAt', 'addedAt', { unique: false })
        }
        if (!db.objectStoreNames.contains(STORES.TEAMS)) {
          db.createObjectStore(STORES.TEAMS, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.SEARCH_HISTORY)) {
          db.createObjectStore(STORES.SEARCH_HISTORY, { keyPath: 'id', autoIncrement: true })
        }
      }

      request.onsuccess = () => {
        dbInstance = request.result
        resolve(dbInstance)
      }

      request.onerror = () => {
        resolve(null)
      }
    } catch {
      resolve(null)
    }
  })

  return dbPromise
}

/**
 * Reads a value from a store with error protection.
 */
async function getStoreValue<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await getDb()
  if (!db) return null

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const req = store.get(key)

      req.onsuccess = () => {
        resolve((req.result as T) ?? null)
      }
      req.onerror = () => {
        resolve(null)
      }
    } catch {
      resolve(null)
    }
  })
}

/**
 * Writes a value to a store with error protection.
 */
async function setStoreValue<T>(storeName: string, key: IDBValidKey, value: T): Promise<void> {
  const db = await getDb()
  if (!db) return

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      store.put(value, key)

      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

// --- High level API for Pokedex chunks & metadata ---

export async function getStoredChunk(index: number): Promise<Pokemon[] | null> {
  return getStoreValue<Pokemon[]>(STORES.CHUNKS, index)
}

export async function setStoredChunk(index: number, pokemon: Pokemon[]): Promise<void> {
  return setStoreValue<Pokemon[]>(STORES.CHUNKS, index, pokemon)
}

export async function getStoredMetadata<T>(key: string): Promise<T | null> {
  return getStoreValue<T>(STORES.METADATA, key)
}

export async function setStoredMetadata<T>(key: string, data: T): Promise<void> {
  return setStoreValue<T>(STORES.METADATA, key, data)
}

export async function getAllStoredPokemon(): Promise<Pokemon[] | null> {
  return getStoreValue<Pokemon[]>(STORES.METADATA, 'all-pokemon')
}

export async function setAllStoredPokemon(pokemon: Pokemon[]): Promise<void> {
  return setStoreValue<Pokemon[]>(STORES.METADATA, 'all-pokemon', pokemon)
}

/**
 * Clears cached pokedex chunks and metadata in IndexedDB.
 */
export async function clearLocalDb(): Promise<void> {
  const db = await getDb()
  if (!db) return

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORES.CHUNKS, STORES.METADATA], 'readwrite')
      tx.objectStore(STORES.CHUNKS).clear()
      tx.objectStore(STORES.METADATA).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}
