import pLimit from "p-limit";

export const POKEAPI_CONCURRENCY = 8;

export function createLimiter(concurrency = POKEAPI_CONCURRENCY) {
  return pLimit(concurrency);
}
