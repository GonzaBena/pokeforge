import { buildGenerations } from "./lib/buildGenerations.ts";
import { buildTypeChart } from "./lib/buildTypeChart.ts";
import { buildMovesIndex } from "./lib/buildMovesIndex.ts";
import { buildNatures } from "./lib/buildNatures.ts";
import { buildPokedex } from "./lib/buildPokedex.ts";
import { buildSpeciesInfo } from "./lib/buildSpeciesInfo.ts";
import { buildEvolutionChains } from "./lib/buildEvolutionChains.ts";
import { buildPokemonDetails } from "./lib/buildPokemonDetails.ts";

async function main() {
  const force = process.argv.includes("--force");
  if (force) console.log("fetch-pokedex: --force set, ignoring disk cache");

  const { generations, speciesToGeneration, versionToGroup, groupToGeneration } = await buildGenerations(force);
  await buildTypeChart(force);
  await buildMovesIndex(force);
  await buildNatures(force);
  const pokedexResult = await buildPokedex(speciesToGeneration, force);

  if (pokedexResult.failedIds.length > 0) {
    console.error(
      `fetch-pokedex: ${pokedexResult.failedIds.length} pokemon failed: ${pokedexResult.failedIds.join(", ")}`,
    );
    console.error("Re-run `pnpm fetch:pokedex` to retry only the failed ids.");
    process.exitCode = 1;
    return;
  }

  const speciesResult = await buildSpeciesInfo(pokedexResult.totalCount, force);
  const chainsResult = await buildEvolutionChains(speciesResult.evolutionChainIds, force);
  const detailsResult = await buildPokemonDetails(
    pokedexResult.totalCount,
    speciesResult.speciesInfoById,
    chainsResult.chains,
    chainsResult.itemEs,
    speciesToGeneration,
    generations,
    versionToGroup,
    groupToGeneration,
    force,
  );

  const failedTotal = speciesResult.failedIds.length + chainsResult.failedIds.length + detailsResult.failedIds.length;
  if (failedTotal > 0) {
    console.error(
      `fetch-pokedex: ${speciesResult.failedIds.length} species, ${chainsResult.failedIds.length} evolution chains ` +
        `and ${detailsResult.failedIds.length} pokemon details failed.`,
    );
    console.error("Re-run `pnpm fetch:pokedex` to retry only the failed ones.");
    process.exitCode = 1;
    return;
  }

  console.log("fetch-pokedex: done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
