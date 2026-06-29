import type { Champion, Team } from "./types";
import { levelUpTeam, healTeam } from "./leveling";

function getFastestAliveChampion(team: Team): Champion | undefined {
  return team
    .filter(champion => champion.currentHp > 0)
    .sort((a, b) => b.speed - a.speed)[0];
}

function getMostVulnerableAliveChampion(team: Team): Champion | undefined {
  return team
    .filter(champion => champion.currentHp > 0)
    .sort((a, b) => a.currentHp - b.currentHp)[0];
}

export function simulateBattle(teamA: Team, teamB: Team, isDuel: boolean = false): string {
  const aliveA = [...teamA];
  const aliveB = [...teamB];

  while (aliveA.some(champion => champion.currentHp > 0) && aliveB.some(champion => champion.currentHp > 0)) {
    const attackerA = getFastestAliveChampion(aliveA);
    const attackerB = getFastestAliveChampion(aliveB);

    if (attackerA && attackerB) {
      const targetB = getMostVulnerableAliveChampion(aliveB);
      if (targetB) {
        targetB.currentHp -= attackerA.attack;
      }

      const targetA = getMostVulnerableAliveChampion(aliveA);
      if (targetA) {
        targetA.currentHp -= attackerB.attack;
      }
    } else {
      break;
    }
  }

  const teamAWins = aliveA.some(champion => champion.currentHp > 0);

  if (teamAWins) {
    if (isDuel) {
      levelUpTeam(aliveA);
    } else {
      levelUpTeam(aliveA);
      levelUpTeam(aliveA);
      levelUpTeam(aliveA);
    }

    // Curar una part de l'equip després de cada combat guanyat
    healTeam(aliveA, 0.5);
    return "Team A wins";
  } else {
    return "Team B wins";
  }
}
