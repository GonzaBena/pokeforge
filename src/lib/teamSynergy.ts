import type { Pokemon, TypeChart } from "./types";
import { computeTeamDefense, computeTeamOffense, getTypeMultiplier, type AttackSource } from "./typeChart";

export interface SynergySuggestion {
  pokemon: Pokemon;
  score: number;
  keyResistances: string[];
  keyImmunities: string[];
  coveredBlindSpots: string[];
  newTypes: string[];
}

export interface RecommendedType {
  type: string;
  resistsTeamWeaknesses: string[];
  coversBlindSpots: string[];
  score: number;
}

export interface TeamSynergyReport {
  criticalWeaknesses: string[];
  exposedWeaknesses: string[];
  blindSpots: string[];
  recommendedTypes: RecommendedType[];
  suggestions: SynergySuggestion[];
}

export function computeTeamSynergy(
  chart: TypeChart,
  team: Pokemon[],
  allCandidates: Pokemon[],
  options?: {
    limit?: number;
    gameSpeciesSet?: Set<number>;
  }
): TeamSynergyReport {
  const limit = options?.limit ?? 6;
  const gameSpeciesSet = options?.gameSpeciesSet;

  if (!team.length) {
    return {
      criticalWeaknesses: [],
      exposedWeaknesses: [],
      blindSpots: [],
      recommendedTypes: [],
      suggestions: [],
    };
  }

  // 1. Analyze defense weaknesses
  const defense = computeTeamDefense(chart, team);
  const criticalWeaknesses = defense.filter((d) => d.threatLevel === "critical").map((d) => d.type);
  const exposedWeaknesses = defense.filter((d) => d.threatLevel === "exposed").map((d) => d.type);
  const coveredWeaknesses = defense.filter((d) => d.threatLevel === "covered").map((d) => d.type);

  // 2. Analyze offensive blind spots (using STAB of current team)
  const attackSources: AttackSource[] = team.flatMap((p) =>
    p.types.map((t) => ({ pokemonName: p.name, type: t }))
  );
  const offense = computeTeamOffense(chart, attackSources);
  const blindSpots = offense.blindSpots.map((b) => b.targetType);

  // 3. Current team type presence
  const currentTeamTypeCounts = new Map<string, number>();
  for (const p of team) {
    for (const t of p.types) {
      currentTeamTypeCounts.set(t, (currentTeamTypeCounts.get(t) ?? 0) + 1);
    }
  }
  const currentTeamIds = new Set(team.map((p) => p.id));

  // 4. Calculate recommended single types (which elemental types help the team most?)
  const typeScores = chart.types.map((type): RecommendedType => {
    const resistsTeamWeaknesses: string[] = [];
    const coversBlindSpots: string[] = [];
    let score = 0;

    for (const weakType of criticalWeaknesses) {
      const mult = chart.chart[weakType]?.[type] ?? 1;
      if (mult === 0) {
        score += 5;
        resistsTeamWeaknesses.push(weakType);
      } else if (mult < 1) {
        score += 3.5;
        resistsTeamWeaknesses.push(weakType);
      } else if (mult > 1) {
        score -= 3;
      }
    }

    for (const expType of exposedWeaknesses) {
      const mult = chart.chart[expType]?.[type] ?? 1;
      if (mult === 0) {
        score += 4;
        resistsTeamWeaknesses.push(expType);
      } else if (mult < 1) {
        score += 3;
        resistsTeamWeaknesses.push(expType);
      } else if (mult > 1) {
        score -= 2;
      }
    }

    for (const covType of coveredWeaknesses) {
      const mult = chart.chart[covType]?.[type] ?? 1;
      if (mult === 0) {
        score += 2.5;
        resistsTeamWeaknesses.push(covType);
      } else if (mult < 1) {
        score += 1.5;
        resistsTeamWeaknesses.push(covType);
      }
    }

    for (const bs of blindSpots) {
      if ((chart.chart[type]?.[bs] ?? 1) >= 2) {
        score += 3;
        coversBlindSpots.push(bs);
      }
    }

    // Type redundancy deduction
    const existingCount = currentTeamTypeCounts.get(type) ?? 0;
    if (existingCount >= 2) score -= 3;
    else if (existingCount === 1) score -= 1;
    else score += 1;

    return {
      type,
      resistsTeamWeaknesses: Array.from(new Set(resistsTeamWeaknesses)),
      coversBlindSpots: Array.from(new Set(coversBlindSpots)),
      score,
    };
  });

  const recommendedTypes = typeScores
    .filter((rt) => rt.score > 0 && (rt.resistsTeamWeaknesses.length > 0 || rt.coversBlindSpots.length > 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 5. Evaluate candidate Pokémon
  const scoredCandidates: SynergySuggestion[] = [];

  for (const candidate of allCandidates) {
    if (currentTeamIds.has(candidate.id)) continue;
    if (gameSpeciesSet && !gameSpeciesSet.has(candidate.id)) continue;

    let score = 0;
    const keyResistances: string[] = [];
    const keyImmunities: string[] = [];
    const coveredBlindSpots: string[] = [];
    const newTypes: string[] = [];

    // Check defenses against critical weaknesses
    for (const crit of criticalWeaknesses) {
      const mult = getTypeMultiplier(chart, crit, candidate.types);
      if (mult === 0) {
        score += 6;
        keyImmunities.push(crit);
      } else if (mult <= 0.25) {
        score += 5;
        keyResistances.push(crit);
      } else if (mult < 1) {
        score += 3.5;
        keyResistances.push(crit);
      } else if (mult > 1) {
        score -= 4; // Compounding critical weakness
      }
    }

    // Check defenses against exposed weaknesses
    for (const exp of exposedWeaknesses) {
      const mult = getTypeMultiplier(chart, exp, candidate.types);
      if (mult === 0) {
        score += 5;
        keyImmunities.push(exp);
      } else if (mult <= 0.25) {
        score += 4;
        keyResistances.push(exp);
      } else if (mult < 1) {
        score += 3;
        keyResistances.push(exp);
      } else if (mult > 1) {
        score -= 2.5;
      }
    }

    // Check defenses against covered weaknesses
    for (const cov of coveredWeaknesses) {
      const mult = getTypeMultiplier(chart, cov, candidate.types);
      if (mult === 0) {
        score += 3;
        keyImmunities.push(cov);
      } else if (mult < 1) {
        score += 1.5;
        keyResistances.push(cov);
      } else if (mult > 1) {
        score -= 1;
      }
    }

    // Check offensive blind spots
    for (const bs of blindSpots) {
      const hitsBlindSpot = candidate.types.some((t) => (chart.chart[t]?.[bs] ?? 1) >= 2);
      if (hitsBlindSpot) {
        score += 3;
        coveredBlindSpots.push(bs);
      }
    }

    // Redundancy check
    for (const t of candidate.types) {
      const count = currentTeamTypeCounts.get(t) ?? 0;
      if (count >= 2) score -= 3;
      else if (count === 1) score -= 0.8;
      else {
        score += 1.5;
        newTypes.push(t);
      }
    }

    // Must solve at least one actual problem to be suggested
    if (score > 0 && (keyResistances.length > 0 || keyImmunities.length > 0 || coveredBlindSpots.length > 0)) {
      scoredCandidates.push({
        pokemon: candidate,
        score,
        keyResistances: Array.from(new Set(keyResistances)),
        keyImmunities: Array.from(new Set(keyImmunities)),
        coveredBlindSpots: Array.from(new Set(coveredBlindSpots)),
        newTypes,
      });
    }
  }

  // Sort descending by synergy score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Group to maintain diversity (max 2 Pokémon with identical primary/secondary types)
  const finalSuggestions: SynergySuggestion[] = [];
  const typePairCounts = new Map<string, number>();

  for (const item of scoredCandidates) {
    const pairKey = item.pokemon.types.slice().sort().join("-");
    const count = typePairCounts.get(pairKey) ?? 0;
    if (count >= 2) continue;

    typePairCounts.set(pairKey, count + 1);
    finalSuggestions.push(item);
    if (finalSuggestions.length >= limit) break;
  }

  return {
    criticalWeaknesses,
    exposedWeaknesses,
    blindSpots,
    recommendedTypes,
    suggestions: finalSuggestions,
  };
}
