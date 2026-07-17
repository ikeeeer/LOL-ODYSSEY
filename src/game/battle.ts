import type { Champion, Team } from "./types";
import {
  applyCombatPassives,
  applyPostBattleBonuses,
  applyTeamSynergies,
  applySonaBuff,
  calculateCombatDamage,
  getEffectiveSpeed,
  resetCombatState
} from "./passives";

function resolveAttack(attacker: Champion, defender: Champion, teamA: Team, teamB: Team): number {
  const team = teamA.includes(attacker) ? teamA : teamB;
  const sonaMessages = applySonaBuff(team, attacker);
  sonaMessages.forEach(message => console.log(message));

  const baseDamage = calculateCombatDamage(attacker, defender);
  const passiveResult = applyCombatPassives(attacker, defender, baseDamage);
  passiveResult.logMessages.forEach(message => console.log(message));

  defender.currentHp -= passiveResult.damage;

  const defenderState = defender as Champion & { combatSupportHealPercent?: number };
  if (defender.currentHp > 0 && (defenderState.combatSupportHealPercent || 0) > 0) {
    const healAmount = Math.max(1, Math.floor(defender.maxHp * (defenderState.combatSupportHealPercent || 0)));
    defender.currentHp = Math.min(defender.maxHp, defender.currentHp + healAmount);
    console.log(`  💚 ${defender.name} recovers ${healAmount} HP from Support synergy.`);
  }

  return passiveResult.damage;
}

export function simulateBattle(teamA: Team, teamB: Team): string {
  resetCombatState(teamA);
  resetCombatState(teamB);
  applyTeamSynergies(teamA).forEach(message => console.log(message));
  applyTeamSynergies(teamB).forEach(message => console.log(message));

  console.log("\n--- BATTLE STARTED ---\n");

  // Índexs del primer campió viu de cada equip
  let indexA = 0;
  let indexB = 0;

  let champA = teamA[indexA];
  let champB = teamB[indexB];

  while (champA && champB) {
    console.log(`${champA.name} (${champA.currentHp}/${champA.maxHp}) vs ${champB.name} (${champB.currentHp}/${champB.maxHp})`);

    const aFirst = getEffectiveSpeed(champA) >= getEffectiveSpeed(champB);

    if (aFirst) {
      const damageA = resolveAttack(champA, champB, teamA, teamB);
      console.log(`  ➜ ${champA.name} attacks ${champB.name} for ${damageA} damage.`);
      if (champB.currentHp <= 0) {
        console.log(`    💀 ${champB.name} has died!\n`);
      } else {
        const damageB = resolveAttack(champB, champA, teamA, teamB);
        console.log(`  ➜ ${champB.name} attacks ${champA.name} for ${damageB} damage.`);
        if (champA.currentHp <= 0) {
          console.log(`    💀 ${champA.name} has died!\n`);
        } else {
          console.log();
        }
      }
    } else {
      const damageB = resolveAttack(champB, champA, teamA, teamB);
      console.log(`  ➜ ${champB.name} attacks ${champA.name} for ${damageB} damage.`);
      if (champA.currentHp <= 0) {
        console.log(`    💀 ${champA.name} has died!\n`);
      } else {
        const damageA = resolveAttack(champA, champB, teamA, teamB);
        console.log(`  ➜ ${champA.name} attacks ${champB.name} for ${damageA} damage.`);
        if (champB.currentHp <= 0) {
          console.log(`    💀 ${champB.name} has died!\n`);
        } else {
          console.log();
        }
      }
    }

    // Avança al següent campió si ha mort
    if (champA.currentHp <= 0) {
      indexA++;
      champA = teamA[indexA];
    }
    if (champB.currentHp <= 0) {
      indexB++;
      champB = teamB[indexB];
    }
  }

  const teamAWins = teamA.some(champion => champion.currentHp > 0);

  if (teamAWins) {
    const postBattleMessages = applyPostBattleBonuses(teamA);
    postBattleMessages.forEach(message => console.log(message));
    console.log("\n✓ Team A WINS!");
    return "Team A wins";
  } else {
    const postBattleMessages = applyPostBattleBonuses(teamB);
    postBattleMessages.forEach(message => console.log(message));
    console.log("\n✗ Team B WINS!");
    return "Team B wins";
  }
}
