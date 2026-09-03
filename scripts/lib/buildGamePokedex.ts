import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { GameDexData, GameVersionMeta, GenerationInfo } from "../../src/lib/types.ts";

const CACHE_ROOT = path.resolve(import.meta.dirname, "..", ".cache");
const PUBLIC_OUT = path.resolve(import.meta.dirname, "..", "..", "public", "data", "pokedex");
const DIST_OUT = path.resolve(import.meta.dirname, "..", "..", "dist", "data", "pokedex");
const GENS_FILE = path.resolve(import.meta.dirname, "..", "..", "public", "data", "generations", "generations.json");

interface EvolutionChainNode {
  species: { name: string; url: string };
  evolves_to: EvolutionChainNode[];
}

interface EvolutionChainResponse {
  chain: EvolutionChainNode;
}

interface SpeciesResponse {
  id: number;
  generation: { name: string; url: string };
  evolution_chain: { url: string } | null;
  pokedex_numbers: {
    entry_number: number;
    pokedex: { name: string; url: string };
  }[];
}

interface EncounterResponse {
  version_details: {
    version: { name: string; url: string };
  }[];
}

interface VersionGroupResponse {
  name: string;
  pokedexes: { name: string; url: string }[];
  versions: { name: string; url: string }[];
}

interface VersionResponse {
  name: string;
  version_group: { name: string; url: string };
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match) throw new Error(`Cannot extract id from ${url}`);
  return Number(match[1]);
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const VERSION_METADATA: Record<string, { name: string; nameEs: string; color: string }> = {
  // Gen 1
  red: { name: "Red", nameEs: "Rojo", color: "#e3350d" },
  blue: { name: "Blue", nameEs: "Azul", color: "#2980b9" },
  yellow: { name: "Yellow", nameEs: "Amarillo", color: "#f39c12" },
  "red-japan": { name: "Red (JP)", nameEs: "Rojo (JP)", color: "#e3350d" },
  "green-japan": { name: "Green (JP)", nameEs: "Verde (JP)", color: "#27ae60" },
  "blue-japan": { name: "Blue (JP)", nameEs: "Azul (JP)", color: "#2980b9" },
  // Gen 2
  gold: { name: "Gold", nameEs: "Oro", color: "#d4af37" },
  silver: { name: "Silver", nameEs: "Plata", color: "#95a5a6" },
  crystal: { name: "Crystal", nameEs: "Cristal", color: "#48dbfb" },
  // Gen 3
  ruby: { name: "Ruby", nameEs: "Rubí", color: "#c0392b" },
  sapphire: { name: "Sapphire", nameEs: "Zafiro", color: "#0984e3" },
  emerald: { name: "Emerald", nameEs: "Esmeralda", color: "#00b894" },
  firered: { name: "FireRed", nameEs: "Rojo Fuego", color: "#e15f41" },
  leafgreen: { name: "LeafGreen", nameEs: "Verde Hoja", color: "#44bd32" },
  colosseum: { name: "Colosseum", nameEs: "Colosseum", color: "#6c5ce7" },
  xd: { name: "XD", nameEs: "XD", color: "#575fcf" },
  // Gen 4
  diamond: { name: "Diamond", nameEs: "Diamante", color: "#0abde3" },
  pearl: { name: "Pearl", nameEs: "Perla", color: "#ea8685" },
  platinum: { name: "Platinum", nameEs: "Platino", color: "#778ca3" },
  heartgold: { name: "HeartGold", nameEs: "HeartGold", color: "#d4af37" },
  soulsilver: { name: "SoulSilver", nameEs: "SoulSilver", color: "#747d8c" },
  // Gen 5
  black: { name: "Black", nameEs: "Negro", color: "#3d4852" },
  white: { name: "White", nameEs: "Blanco", color: "#b2bec3" },
  "black-2": { name: "Black 2", nameEs: "Negro 2", color: "#3d4852" },
  "white-2": { name: "White 2", nameEs: "Blanco 2", color: "#b2bec3" },
  // Gen 6
  x: { name: "X", nameEs: "X", color: "#0984e3" },
  y: { name: "Y", nameEs: "Y", color: "#eb2f06" },
  "omega-ruby": { name: "Omega Ruby", nameEs: "Rubí Omega", color: "#c0392b" },
  "alpha-sapphire": { name: "Alpha Sapphire", nameEs: "Zafiro Alfa", color: "#0984e3" },
  // Gen 7
  sun: { name: "Sun", nameEs: "Sol", color: "#e67e22" },
  moon: { name: "Moon", nameEs: "Luna", color: "#6c5ce7" },
  "ultra-sun": { name: "Ultra Sun", nameEs: "Ultra Sol", color: "#d35400" },
  "ultra-moon": { name: "Ultra Moon", nameEs: "Ultra Luna", color: "#575fcf" },
  "lets-go-pikachu": { name: "Let's Go Pikachu", nameEs: "Let's Go Pikachu", color: "#f1c40f" },
  "lets-go-eevee": { name: "Let's Go Eevee", nameEs: "Let's Go Eevee", color: "#b8860b" },
  // Gen 8
  sword: { name: "Sword", nameEs: "Espada", color: "#00a8ff" },
  shield: { name: "Shield", nameEs: "Escudo", color: "#e84118" },
  "the-isle-of-armor-sword": { name: "Isle of Armor (Sword)", nameEs: "Isla de la Armadura (Espada)", color: "#00a8ff" },
  "the-isle-of-armor-shield": { name: "Isle of Armor (Shield)", nameEs: "Isla de la Armadura (Escudo)", color: "#e84118" },
  "the-crown-tundra-sword": { name: "Crown Tundra (Sword)", nameEs: "Nieves de la Corona (Espada)", color: "#00a8ff" },
  "the-crown-tundra-shield": { name: "Crown Tundra (Shield)", nameEs: "Nieves de la Corona (Escudo)", color: "#e84118" },
  "brilliant-diamond": { name: "Brilliant Diamond", nameEs: "Diamante Brillante", color: "#0abde3" },
  "shining-pearl": { name: "Shining Pearl", nameEs: "Perla Reluciente", color: "#ea8685" },
  "legends-arceus": { name: "Legends: Arceus", nameEs: "Leyendas: Arceus", color: "#d1ccc0" },
  // Gen 9
  scarlet: { name: "Scarlet", nameEs: "Escarlata", color: "#eb2f06" },
  violet: { name: "Violet", nameEs: "Púrpura", color: "#8854d0" },
  "the-teal-mask-scarlet": { name: "Teal Mask (Scarlet)", nameEs: "Máscara Turquesa (Escarlata)", color: "#eb2f06" },
  "the-teal-mask-violet": { name: "Teal Mask (Violet)", nameEs: "Máscara Turquesa (Púrpura)", color: "#8854d0" },
  "the-indigo-disk-scarlet": { name: "Indigo Disk (Scarlet)", nameEs: "Disco Índigo (Escarlata)", color: "#eb2f06" },
  "the-indigo-disk-violet": { name: "Indigo Disk (Violet)", nameEs: "Disco Índigo (Púrpura)", color: "#8854d0" },
  "legends-za": { name: "Legends: Z-A", nameEs: "Leyendas: Z-A", color: "#10ac84" },
  "mega-dimension": { name: "Mega Dimension", nameEs: "Mega Dimensión", color: "#5f27cd" },
  champions: { name: "Champions", nameEs: "Champions", color: "#ee5253" },
};

const CURATED_EXCLUSIVES: Record<string, Record<string, number[]>> = {
  "scarlet-violet": {
    scarlet: [246, 247, 248, 425, 426, 434, 435, 633, 634, 635, 690, 691, 765, 874, 936, 984, 985, 986, 987, 988, 989, 1005, 1007, 1009, 1020, 1021],
    violet: [200, 429, 316, 317, 371, 372, 373, 692, 693, 766, 875, 885, 886, 887, 937, 990, 991, 992, 993, 994, 995, 1006, 1008, 1010, 1022, 1023],
  },
  "x-y": {
    x: [120, 121, 127, 261, 262, 304, 305, 306, 309, 310, 538, 684, 685, 692, 693, 716],
    y: [90, 91, 214, 228, 229, 246, 247, 248, 509, 510, 539, 682, 683, 690, 691, 717],
  },
};

export async function buildGamePokedex(): Promise<GameDexData> {
  const gens = await readJson<GenerationInfo[]>(GENS_FILE);
  if (!gens) throw new Error(`Could not read generations from ${GENS_FILE}`);

  // 1. Version to version-group mapping
  const versionToGroup = new Map<string, string>();
  const vDir = path.join(CACHE_ROOT, "version");
  if (existsSync(vDir)) {
    const { readdir } = await import("node:fs/promises");
    const vFiles = await readdir(vDir);
    for (const vf of vFiles) {
      if (!vf.endsWith(".json")) continue;
      const vdata = await readJson<VersionResponse>(path.join(vDir, vf));
      if (vdata?.name && vdata?.version_group?.name) {
        versionToGroup.set(vdata.name, vdata.version_group.name);
      }
    }
  }

  // 2. Version group to pokedex names & versions
  const groupPokedexes = new Map<string, string[]>();
  const groupVersions = new Map<string, string[]>();
  const vgDir = path.join(CACHE_ROOT, "version-group");
  if (existsSync(vgDir)) {
    const { readdir } = await import("node:fs/promises");
    const vgFiles = await readdir(vgDir);
    for (const vgf of vgFiles) {
      if (!vgf.endsWith(".json")) continue;
      const gname = vgf.replace(/\.json$/, "");
      const vgdata = await readJson<VersionGroupResponse>(path.join(vgDir, vgf));
      if (vgdata?.pokedexes) {
        groupPokedexes.set(
          gname,
          vgdata.pokedexes.map((p) => p.name),
        );
      }
      if (vgdata?.versions) {
        groupVersions.set(
          gname,
          vgdata.versions.map((v) => v.name),
        );
      }
    }
  }

  // 3. Species info: pokedex entries, evolution chains, generations
  const pokedexToSpecies = new Map<string, Set<number>>();
  const speciesChainId = new Map<number, number>();
  const speciesDir = path.join(CACHE_ROOT, "species");
  if (existsSync(speciesDir)) {
    const { readdir } = await import("node:fs/promises");
    const sFiles = await readdir(speciesDir);
    for (const sf of sFiles) {
      if (!sf.endsWith(".json")) continue;
      const sid = Number(sf.replace(/\.json$/, ""));
      if (Number.isNaN(sid)) continue;
      const sdata = await readJson<SpeciesResponse>(path.join(speciesDir, sf));
      if (!sdata) continue;

      if (sdata.evolution_chain?.url) {
        speciesChainId.set(sid, idFromUrl(sdata.evolution_chain.url));
      }

      for (const entry of sdata.pokedex_numbers ?? []) {
        const pname = entry.pokedex.name;
        let set = pokedexToSpecies.get(pname);
        if (!set) {
          set = new Set();
          pokedexToSpecies.set(pname, set);
        }
        set.add(sid);
      }
    }
  }

  // 4. Encounters per version group and per specific version
  const groupEncounters = new Map<string, Set<number>>();
  const versionEncounters = new Map<string, Set<number>>();
  const encDir = path.join(CACHE_ROOT, "encounters");
  if (existsSync(encDir)) {
    const { readdir } = await import("node:fs/promises");
    const eFiles = await readdir(encDir);
    for (const ef of eFiles) {
      if (!ef.endsWith(".json")) continue;
      const sid = Number(ef.replace(/\.json$/, ""));
      if (Number.isNaN(sid)) continue;
      const edata = await readJson<EncounterResponse[]>(path.join(encDir, ef));
      if (!edata) continue;

      for (const enc of edata) {
        for (const vd of enc.version_details ?? []) {
          const vname = vd.version.name;

          let vset = versionEncounters.get(vname);
          if (!vset) {
            vset = new Set();
            versionEncounters.set(vname, vset);
          }
          vset.add(sid);

          const gname = versionToGroup.get(vname);
          if (gname) {
            let set = groupEncounters.get(gname);
            if (!set) {
              set = new Set();
              groupEncounters.set(gname, set);
            }
            set.add(sid);
          }
        }
      }
    }
  }

  // 5. Evolution chain species sets
  const chainSpeciesMap = new Map<number, Set<number>>();
  const chainDir = path.join(CACHE_ROOT, "evolution-chain");
  if (existsSync(chainDir)) {
    const { readdir } = await import("node:fs/promises");
    const cFiles = await readdir(chainDir);
    for (const cf of cFiles) {
      if (!cf.endsWith(".json")) continue;
      const cid = Number(cf.replace(/\.json$/, ""));
      if (Number.isNaN(cid)) continue;
      const cdata = await readJson<EvolutionChainResponse>(path.join(chainDir, cf));
      if (!cdata?.chain) continue;

      const set = new Set<number>();
      const walk = (node: EvolutionChainNode) => {
        if (node.species?.url) {
          set.add(idFromUrl(node.species.url));
        }
        for (const child of node.evolves_to ?? []) {
          walk(child);
        }
      };
      walk(cdata.chain);
      chainSpeciesMap.set(cid, set);
    }
  }

  // 6. Compute regional, obtainable, versions, and exclusives for each version group
  const genMaxId = new Map<number, number>();
  for (const g of gens) {
    genMaxId.set(g.id, g.speciesIdRange[1]);
  }

  const result: GameDexData = {};

  for (const g of gens) {
    const maxId = genMaxId.get(g.id) ?? 1025;
    for (const vg of g.versionGroups) {
      const vgName = vg.name;

      // Regional: species belonging to this game's regional pokedex(es)
      const pokes = groupPokedexes.get(vgName) ?? [];
      const regionalSet = new Set<number>();
      for (const p of pokes) {
        const speciesInDex = pokedexToSpecies.get(p);
        if (speciesInDex) {
          for (const sid of speciesInDex) {
            if (sid <= maxId) regionalSet.add(sid);
          }
        }
      }

      // Obtainable: regional + direct wild/gift encounters + evolution chain propagation
      const obtainableSet = new Set<number>(regionalSet);
      const encounters = groupEncounters.get(vgName);
      if (encounters) {
        for (const sid of encounters) {
          if (sid <= maxId) obtainableSet.add(sid);
        }
      }

      let added = true;
      while (added) {
        added = false;
        for (const sid of Array.from(obtainableSet)) {
          const cid = speciesChainId.get(sid);
          if (cid) {
            const family = chainSpeciesMap.get(cid);
            if (family) {
              for (const relId of family) {
                if (relId <= maxId && !obtainableSet.has(relId)) {
                  obtainableSet.add(relId);
                  added = true;
                }
              }
            }
          }
        }
      }

      // Fallback: if a game has no official regional dex (like Colosseum or XD), regional matches obtainable
      if (regionalSet.size === 0) {
        for (const sid of obtainableSet) {
          regionalSet.add(sid);
        }
      }

      // Versions and exclusives
      const versionIds = groupVersions.get(vgName) ?? [];
      const versionsMeta: GameVersionMeta[] = versionIds.map((vid) => {
        const meta = VERSION_METADATA[vid];
        return {
          id: vid,
          name: meta?.name ?? vid,
          nameEs: meta?.nameEs ?? meta?.name ?? vid,
          color: meta?.color ?? "#e3350d",
        };
      });

      const exclusives: Record<string, number[]> = {};

      if (versionIds.length === 2) {
        const [vA, vB] = versionIds;
        if (vgName in CURATED_EXCLUSIVES) {
          const cur = CURATED_EXCLUSIVES[vgName];
          if (cur[vA]) exclusives[vA] = cur[vA].filter((sid) => obtainableSet.has(sid)).sort((a, b) => a - b);
          if (cur[vB]) exclusives[vB] = cur[vB].filter((sid) => obtainableSet.has(sid)).sort((a, b) => a - b);
        } else if (vgName === "brilliant-diamond-shining-pearl") {
          const dEnc = versionEncounters.get("diamond") ?? new Set<number>();
          const pEnc = versionEncounters.get("pearl") ?? new Set<number>();
          exclusives[vA] = Array.from(dEnc).filter((sid) => !pEnc.has(sid) && obtainableSet.has(sid)).sort((a, b) => a - b);
          exclusives[vB] = Array.from(pEnc).filter((sid) => !dEnc.has(sid) && obtainableSet.has(sid)).sort((a, b) => a - b);
        } else {
          // Automatic encounter + evolution chain propagation
          const vASet = new Set<number>(versionEncounters.get(vA) ?? []);
          const vBSet = new Set<number>(versionEncounters.get(vB) ?? []);
          let evoAdded = true;
          while (evoAdded) {
            evoAdded = false;
            for (const sid of Array.from(vASet)) {
              const cid = speciesChainId.get(sid);
              if (cid) {
                const family = chainSpeciesMap.get(cid);
                if (family) {
                  for (const relId of family) {
                    if (relId <= maxId && !vASet.has(relId)) {
                      vASet.add(relId);
                      evoAdded = true;
                    }
                  }
                }
              }
            }
            for (const sid of Array.from(vBSet)) {
              const cid = speciesChainId.get(sid);
              if (cid) {
                const family = chainSpeciesMap.get(cid);
                if (family) {
                  for (const relId of family) {
                    if (relId <= maxId && !vBSet.has(relId)) {
                      vBSet.add(relId);
                      evoAdded = true;
                    }
                  }
                }
              }
            }
          }

          const exA = Array.from(vASet).filter((sid) => !vBSet.has(sid) && obtainableSet.has(sid)).sort((a, b) => a - b);
          const exB = Array.from(vBSet).filter((sid) => !vASet.has(sid) && obtainableSet.has(sid)).sort((a, b) => a - b);
          if (exA.length > 0 || exB.length > 0) {
            exclusives[vA] = exA;
            exclusives[vB] = exB;
          }
        }
      }

      result[vgName] = {
        regional: Array.from(regionalSet).sort((a, b) => a - b),
        obtainable: Array.from(obtainableSet).sort((a, b) => a - b),
        versions: versionsMeta.length > 0 ? versionsMeta : undefined,
        exclusives: Object.keys(exclusives).length > 0 ? exclusives : undefined,
      };
    }
  }

  // 7. Write to public and dist
  await mkdir(PUBLIC_OUT, { recursive: true });
  await writeFile(path.join(PUBLIC_OUT, "game-pokedex.json"), JSON.stringify(result), "utf-8");

  if (existsSync(DIST_OUT)) {
    await writeFile(path.join(DIST_OUT, "game-pokedex.json"), JSON.stringify(result), "utf-8");
  }

  console.log(`game-pokedex: generated regional, obtainable, and exclusives for ${Object.keys(result).length} version groups`);
  return result;
}

if (process.argv[1]?.endsWith("buildGamePokedex.ts")) {
  buildGamePokedex().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
