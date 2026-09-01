import type { TypeChart } from "./types";

export interface TeamMember {
  name: string;
  types: string[];
}

export interface TeamDefenseEntry {
  type: string;
  averageMultiplier: number;
  weakMembers: string[];
  resistMembers: string[];
  immuneMembers: string[];
}

export function getTypeMultiplier(chart: TypeChart, attackingType: string, defendingTypes: string[]): number {
  return defendingTypes.reduce((mult, def) => mult * (chart.chart[attackingType]?.[def] ?? 1), 1);
}

export function computeTeamDefense(chart: TypeChart, team: TeamMember[]): TeamDefenseEntry[] {
  return chart.types
    .map((attackingType): TeamDefenseEntry => {
      const weakMembers: string[] = [];
      const resistMembers: string[] = [];
      const immuneMembers: string[] = [];
      let total = 0;

      for (const member of team) {
        const mult = getTypeMultiplier(chart, attackingType, member.types);
        total += mult;
        if (mult === 0) immuneMembers.push(member.name);
        else if (mult > 1) weakMembers.push(member.name);
        else if (mult < 1) resistMembers.push(member.name);
      }

      return {
        type: attackingType,
        averageMultiplier: team.length ? total / team.length : 1,
        weakMembers,
        resistMembers,
        immuneMembers,
      };
    })
    .sort((a, b) => b.averageMultiplier - a.averageMultiplier);
}

export function splitWeaknessesAndResistances(entries: TeamDefenseEntry[]) {
  const weaknesses = entries.filter((e) => e.averageMultiplier > 1).sort((a, b) => b.averageMultiplier - a.averageMultiplier);
  const resistances = entries
    .filter((e) => e.averageMultiplier < 1)
    .sort((a, b) => a.averageMultiplier - b.averageMultiplier);
  return { weaknesses, resistances };
}
