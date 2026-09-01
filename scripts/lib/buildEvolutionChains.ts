import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import { createLimiter } from "./limiter.ts";
import type { EvolutionChain, EvolutionNode } from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "evolutions");

interface EvolutionDetail {
  trigger: { name: string } | null;
  min_level: number | null;
  item: { name: string; url: string } | null;
}

interface ChainNode {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: ChainNode[];
}

interface EvolutionChainResponse {
  id: number;
  chain: ChainNode;
}

interface ItemResponse {
  names: { name: string; language: { name: string } }[];
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function collectItems(node: ChainNode, items: Map<string, string>): void {
  const detail = node.evolution_details[0];
  if (detail?.item) items.set(detail.item.name, detail.item.url);
  for (const child of node.evolves_to) collectItems(child, items);
}

function flatten(node: ChainNode, evolvesFromSpecies: string | null, itemEs: Map<string, string>): EvolutionNode[] {
  const detail = node.evolution_details[0];
  const itemName = detail?.item?.name ?? null;
  const current: EvolutionNode = {
    speciesId: idFromUrl(node.species.url),
    speciesName: node.species.name,
    evolvesFromSpecies,
    trigger: detail?.trigger?.name ?? null,
    minLevel: detail?.min_level ?? null,
    item: itemName,
    itemDisplay: itemName ? itemEs.get(itemName) ?? null : null,
  };
  const children = node.evolves_to.flatMap((child) => flatten(child, node.species.name, itemEs));
  return [current, ...children];
}

async function fetchItemEs(name: string, url: string, force: boolean): Promise<string | null> {
  try {
    const item = await cachedFetch<ItemResponse>("item", name, () => fetchJson<ItemResponse>(url), force);
    return item.names.find((n) => n.language.name === "es")?.name ?? null;
  } catch {
    return null;
  }
}

async function buildOneChain(
  chainId: number,
  force: boolean,
  chains: Map<number, EvolutionChain>,
  itemEs: Map<string, string>,
  failed: number[],
): Promise<void> {
  try {
    const data = await cachedFetch<EvolutionChainResponse>(
      "evolution-chain",
      String(chainId),
      () => fetchJson<EvolutionChainResponse>(`${API_ROOT}/evolution-chain/${chainId}`),
      force,
    );

    const items = new Map<string, string>();
    collectItems(data.chain, items);
    await Promise.all(
      [...items].map(async ([name, url]) => {
        if (itemEs.has(name)) return;
        const es = await fetchItemEs(name, url, force);
        if (es) itemEs.set(name, es);
      }),
    );

    const chain: EvolutionChain = { chainId, nodes: flatten(data.chain, null, itemEs) };
    chains.set(chainId, chain);
    await writeFile(path.join(OUT_DIR, `chain-${chainId}.json`), JSON.stringify(chain), "utf-8");
  } catch (err) {
    console.error(`evolution-chains: failed for chain ${chainId}: ${String(err)}`);
    failed.push(chainId);
  }
}

export interface BuildEvolutionChainsResult {
  chains: Map<number, EvolutionChain>;
  itemEs: Map<string, string>;
  failedIds: number[];
}

export async function buildEvolutionChains(chainIds: number[], force = false): Promise<BuildEvolutionChainsResult> {
  await mkdir(OUT_DIR, { recursive: true });

  const limit = createLimiter();
  const chains = new Map<number, EvolutionChain>();
  const itemEs = new Map<string, string>();
  const failed: number[] = [];

  console.log(`evolution-chains: building ${chainIds.length} unique chains...`);

  await Promise.all(chainIds.map((id) => limit(() => buildOneChain(id, force, chains, itemEs, failed))));

  console.log(
    `evolution-chains: wrote ${chains.size}/${chainIds.length} chains (${itemEs.size} evolution items, ${failed.length} failed)`,
  );

  return { chains, itemEs, failedIds: failed };
}
