import type { EvolutionChain, Nature, NaturesIndex, PokemonDetail } from "./types";

const DATA_ROOT = "/data";

const detailPromises = new Map<number, Promise<PokemonDetail>>();
const chainPromises = new Map<number, Promise<EvolutionChain>>();
let naturesPromise: Promise<Nature[]> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

export function getPokemonDetail(id: number): Promise<PokemonDetail> {
  let promise = detailPromises.get(id);
  if (!promise) {
    promise = fetchJson<PokemonDetail>(`${DATA_ROOT}/pokemon-detail/${id}.json`);
    detailPromises.set(id, promise);
  }
  return promise;
}

export function getEvolutionChain(chainId: number): Promise<EvolutionChain> {
  let promise = chainPromises.get(chainId);
  if (!promise) {
    promise = fetchJson<EvolutionChain>(`${DATA_ROOT}/evolutions/chain-${chainId}.json`);
    chainPromises.set(chainId, promise);
  }
  return promise;
}

export function getNatures(): Promise<Nature[]> {
  naturesPromise ??= fetchJson<NaturesIndex>(`${DATA_ROOT}/natures/index.json`).then((n) => n.natures);
  return naturesPromise;
}
