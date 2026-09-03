import type { TypeChart } from "./types";

export interface TeamMember {
  name: string;
  types: string[];
}

export interface MemberDefenseImpact {
  name: string;
  multiplier: number;
}

export type DefenseThreatLevel = "critical" | "exposed" | "covered";

export interface TeamDefenseEntry {
  type: string;
  averageMultiplier: number;
  weakDetails: MemberDefenseImpact[];
  resistDetails: MemberDefenseImpact[];
  immuneDetails: MemberDefenseImpact[];
  neutralDetails: MemberDefenseImpact[];
  weakMembers: string[];
  resistMembers: string[];
  immuneMembers: string[];
  weakCount: number;
  resistCount: number;
  immuneCount: number;
  threatLevel: DefenseThreatLevel;
  netScore: number;
}

export function getTypeMultiplier(chart: TypeChart, attackingType: string, defendingTypes: string[]): number {
  return defendingTypes.reduce((mult, def) => mult * (chart.chart[attackingType]?.[def] ?? 1), 1);
}

export function computeTeamDefense(chart: TypeChart, team: TeamMember[]): TeamDefenseEntry[] {
  return chart.types.map((attackingType): TeamDefenseEntry => {
    const weakDetails: MemberDefenseImpact[] = [];
    const resistDetails: MemberDefenseImpact[] = [];
    const immuneDetails: MemberDefenseImpact[] = [];
    const neutralDetails: MemberDefenseImpact[] = [];
    const weakMembers: string[] = [];
    const resistMembers: string[] = [];
    const immuneMembers: string[] = [];
    let product = 1;

    for (const member of team) {
      const mult = getTypeMultiplier(chart, attackingType, member.types);
      product *= mult;
      const impact: MemberDefenseImpact = { name: member.name, multiplier: mult };

      if (mult === 0) {
        immuneDetails.push(impact);
        immuneMembers.push(member.name);
      } else if (mult > 1) {
        weakDetails.push(impact);
        weakMembers.push(member.name);
      } else if (mult < 1) {
        resistDetails.push(impact);
        resistMembers.push(member.name);
      } else {
        neutralDetails.push(impact);
      }
    }

    weakDetails.sort((a, b) => b.multiplier - a.multiplier);
    resistDetails.sort((a, b) => a.multiplier - b.multiplier);

    const weakCount = weakDetails.length;
    const resistCount = resistDetails.length;
    const immuneCount = immuneDetails.length;

    // Severity weighting: 4x counts 2 points, 2x counts 1 point
    const weakPoints = weakDetails.reduce((acc, m) => acc + (m.multiplier >= 4 ? 2 : 1), 0);
    const resistPoints = resistDetails.reduce((acc, m) => acc + (m.multiplier <= 0.25 ? 2 : 1), 0) + (immuneCount * 2);
    const netScore = weakPoints - resistPoints;

    let threatLevel: DefenseThreatLevel = "covered";
    if (
      weakCount >= 3 ||
      (weakDetails.some((m) => m.multiplier >= 4) && resistCount === 0 && immuneCount === 0) ||
      (weakCount >= 2 && resistCount === 0 && immuneCount === 0)
    ) {
      threatLevel = "critical";
    } else if (weakCount > 0 && resistCount === 0 && immuneCount === 0) {
      threatLevel = "exposed";
    }

    const rawAvg = team.length ? Math.pow(product, 1 / team.length) : 1;
    const averageMultiplier = Math.round(rawAvg * 100) / 100;

    return {
      type: attackingType,
      averageMultiplier,
      weakDetails,
      resistDetails,
      immuneDetails,
      neutralDetails,
      weakMembers,
      resistMembers,
      immuneMembers,
      weakCount,
      resistCount,
      immuneCount,
      threatLevel,
      netScore,
    };
  });
}

export function splitWeaknessesAndResistances(entries: TeamDefenseEntry[]) {
  const threatOrder: Record<DefenseThreatLevel, number> = {
    critical: 0,
    exposed: 1,
    covered: 2,
  };

  const weaknesses = entries
    .filter((e) => e.weakCount > 0)
    .sort((a, b) => {
      if (threatOrder[a.threatLevel] !== threatOrder[b.threatLevel]) {
        return threatOrder[a.threatLevel] - threatOrder[b.threatLevel];
      }
      if (b.netScore !== a.netScore) {
        return b.netScore - a.netScore;
      }
      return b.weakCount - a.weakCount;
    });

  const resistances = entries
    .filter((e) => e.weakCount === 0 && e.resistCount > 0)
    .sort((a, b) => b.resistCount - a.resistCount || a.type.localeCompare(b.type));

  const immunities = entries
    .filter((e) => e.immuneCount > 0)
    .sort((a, b) => b.immuneCount - a.immuneCount || a.type.localeCompare(b.type));

  return { weaknesses, resistances, immunities };
}

export interface OffensiveAttacker {
  pokemonName: string;
  attackingType: string;
  moveName?: string;
  multiplier: number;
}

export interface TeamOffenseEntry {
  targetType: string;
  attackers: OffensiveAttacker[];
  isCovered: boolean;
}

export interface TeamOffenseSummary {
  coveredTypes: TeamOffenseEntry[];
  blindSpots: TeamOffenseEntry[];
  coveredCount: number;
  totalTypes: number;
  coveragePercentage: number;
}

export interface AttackSource {
  pokemonName: string;
  type: string;
  moveName?: string;
}

export function computeTeamOffense(
  chart: TypeChart,
  attackSources: AttackSource[]
): TeamOffenseSummary {
  const coveredTypes: TeamOffenseEntry[] = [];
  const blindSpots: TeamOffenseEntry[] = [];

  for (const targetType of chart.types) {
    const attackers: OffensiveAttacker[] = [];
    const seenCombos = new Set<string>();

    for (const source of attackSources) {
      const mult = chart.chart[source.type]?.[targetType] ?? 1;
      if (mult > 1) {
        const comboKey = `${source.pokemonName}|${source.type}|${source.moveName ?? ""}`;
        if (!seenCombos.has(comboKey)) {
          seenCombos.add(comboKey);
          attackers.push({
            pokemonName: source.pokemonName,
            attackingType: source.type,
            moveName: source.moveName,
            multiplier: mult,
          });
        }
      }
    }

    const entry: TeamOffenseEntry = {
      targetType,
      attackers,
      isCovered: attackers.length > 0,
    };

    if (entry.isCovered) {
      coveredTypes.push(entry);
    } else {
      blindSpots.push(entry);
    }
  }

  coveredTypes.sort((a, b) => b.attackers.length - a.attackers.length || a.targetType.localeCompare(b.targetType));
  blindSpots.sort((a, b) => a.targetType.localeCompare(b.targetType));

  const totalTypes = chart.types.length;
  const coveredCount = coveredTypes.length;
  const coveragePercentage = totalTypes ? Math.round((coveredCount / totalTypes) * 100) : 0;

  return {
    coveredTypes,
    blindSpots,
    coveredCount,
    totalTypes,
    coveragePercentage,
  };
}

