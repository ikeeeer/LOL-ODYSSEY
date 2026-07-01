import type { Champion, Team } from "./types";
import { levelUpTeam } from "./leveling";
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
    console.log(`  💚 ${defender.name} recupera ${healAmount} HP per sinergia de Support.`);
  }

  return passiveResult.damage;
}

export function simulateBattle(teamA: Team, teamB: Team, isDuel: boolean = false): string {
  const aliveAtStart = teamA.filter(c => c.currentHp > 0);

  resetCombatState(teamA);
  resetCombatState(teamB);
  applyTeamSynergies(teamA).forEach(message => console.log(message));
  applyTeamSynergies(teamB).forEach(message => console.log(message));

  const aliveA = [...teamA];
  const aliveB = [...teamB];
  let turn = 1;

  console.log("\n--- BATALLA INICIADA ---\n");

  while (aliveA.some(champion => champion.currentHp > 0) && aliveB.some(champion => champion.currentHp > 0)) {
    const activeA = aliveA.find(c => c.currentHp > 0);
    const activeB = aliveB.find(c => c.currentHp > 0);

    if (!activeA || !activeB) break;

    console.log(`Torn ${turn}: ${activeA.name} (${activeA.currentHp}/${activeA.maxHp}) vs ${activeB.name} (${activeB.currentHp}/${activeB.maxHp})`);

    if (getEffectiveSpeed(activeA) > getEffectiveSpeed(activeB)) {
      const damageA = resolveAttack(activeA, activeB, teamA, teamB);
      console.log(`  ➜ ${activeA.name} ataca ${activeB.name} per ${damageA} de dany.`);

      if (activeB.currentHp <= 0) {
        console.log(`    💀 ${activeB.name} HA MORT!\n`);
      } else {
        const damageB = resolveAttack(activeB, activeA, teamA, teamB);
        console.log(`  ➜ ${activeB.name} ataca ${activeA.name} per ${damageB} de dany.`);

        if (activeA.currentHp <= 0) {
          console.log(`    💀 ${activeA.name} HA MORT!\n`);
        } else {
          console.log();
        }
      }
    } else {
      const damageB = resolveAttack(activeB, activeA, teamA, teamB);
      console.log(`  ➜ ${activeB.name} ataca ${activeA.name} per ${damageB} de dany.`);

      if (activeA.currentHp <= 0) {
        console.log(`    💀 ${activeA.name} HA MORT!\n`);
      } else {
        const damageA = resolveAttack(activeA, activeB, teamA, teamB);
        console.log(`  ➜ ${activeA.name} ataca ${activeB.name} per ${damageA} de dany.`);

        if (activeB.currentHp <= 0) {
          console.log(`    💀 ${activeB.name} HA MORT!\n`);
        } else {
          console.log();
        }
      }
    }

    turn += 1;
  }

  const teamAWins = aliveA.some(champion => champion.currentHp > 0);

  if (teamAWins) {
    if (isDuel) {
      levelUpTeam(aliveA, aliveAtStart);
    } else {
      levelUpTeam(aliveA, aliveAtStart);
      levelUpTeam(aliveA, aliveAtStart);
      levelUpTeam(aliveA, aliveAtStart);
    }

    const postBattleMessages = applyPostBattleBonuses(teamA);
    postBattleMessages.forEach(message => console.log(message));
    console.log("\n✓ Team A GUANYA!");
    return "Team A wins";
  } else {
    const postBattleMessages = applyPostBattleBonuses(teamB);
    postBattleMessages.forEach(message => console.log(message));
    console.log("\n✗ Team B GUANYA!");
    return "Team B wins";
  }
}
