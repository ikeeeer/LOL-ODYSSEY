import type { Champion, Team } from "./types";
import {
  applyCombatPassives,
  applyPostBattleBonuses,
  applyTeamSynergies,
  applySonaBuff,
  calculateCombatDamage,
  getEffectiveSpeed,
  resetCombatState,
} from "./passives";

export interface BattleEvent {
  type: "attack" | "death" | "heal" | "info" | "end";
  attackerId?: number;
  defenderId?: number;
  attackerName?: string;
  defenderName?: string;
  damage?: number;
  healAmount?: number;
  message: string;
  // Snapshot dels HP després de l'event
  hpSnapshot: Record<number, number>;
}

export interface BattleResult {
  events: BattleEvent[];
  teamAWins: boolean;
  isDuel: boolean;
}

function resolveAttackStep(
  attacker: Champion,
  defender: Champion,
  teamA: Team,
  teamB: Team,
  hpMap: Record<number, number>
): BattleEvent[] {
  const events: BattleEvent[] = [];
  const team = teamA.includes(attacker) ? teamA : teamB;

  const sonaMessages = applySonaBuff(team, attacker);

  const baseDamage = calculateCombatDamage(attacker, defender);
  const passiveResult = applyCombatPassives(attacker, defender, baseDamage);

  defender.currentHp -= passiveResult.damage;
  // Les passives poden haver modificat l'HP de l'atacant (curacions) o del defensor
  hpMap[defender.id] = defender.currentHp;
  hpMap[attacker.id] = attacker.currentHp;

  // Afegeix missatges de passives i Sona com a events d'info
  [...sonaMessages, ...passiveResult.logMessages].forEach((msg) => {
    events.push({
      type: "info",
      message: msg.trim(),
      hpSnapshot: { ...hpMap },
    });
  });

  events.push({
    type: "attack",
    attackerId: attacker.id,
    defenderId: defender.id,
    attackerName: attacker.name,
    defenderName: defender.name,
    damage: passiveResult.damage,
    message: `${attacker.name} attacks ${defender.name} for ${passiveResult.damage} damage.`,
    hpSnapshot: { ...hpMap },
  });

  const defenderState = defender as Champion & { combatSupportHealPercent?: number };
  if (defender.currentHp > 0 && (defenderState.combatSupportHealPercent || 0) > 0) {
    const healAmount = Math.max(
      1,
      Math.floor(defender.maxHp * (defenderState.combatSupportHealPercent || 0))
    );
    defender.currentHp = Math.min(defender.maxHp, defender.currentHp + healAmount);
    hpMap[defender.id] = defender.currentHp;

    events.push({
      type: "heal",
      defenderId: defender.id,
      defenderName: defender.name,
      healAmount,
      message: `${defender.name} recovers ${healAmount} HP from Support synergy.`,
      hpSnapshot: { ...hpMap },
    });
  }

  if (defender.currentHp <= 0) {
    events.push({
      type: "death",
      defenderId: defender.id,
      defenderName: defender.name,
      message: `${defender.name} has died!`,
      hpSnapshot: { ...hpMap },
    });
  }

  return events;
}

export function simulateBattleStepByStep(
  teamA: Team,
  teamB: Team,
  isDuel: boolean = false
): BattleResult {
  resetCombatState(teamA);
  resetCombatState(teamB);
  applyTeamSynergies(teamA);
  applyTeamSynergies(teamB);

  // Snapshot inicial dels HP
  const hpMap: Record<number, number> = {};
  [...teamA, ...teamB].forEach((c) => {
    hpMap[c.id] = c.currentHp;
  });

  const events: BattleEvent[] = [];

  events.push({
    type: "info",
    message: "BATTLE STARTED",
    hpSnapshot: { ...hpMap },
  });

  // Índexs del primer campió viu de cada equip
  let indexA = 0;
  let indexB = 0;

  let champA = teamA[indexA];
  let champB = teamB[indexB];

  while (champA && champB) {
    events.push({
      type: "info",
      message: `${champA.name} vs ${champB.name}`,
      hpSnapshot: { ...hpMap },
    });

    // Determina qui ataca primer segons velocitat
    const aFirst = getEffectiveSpeed(champA) >= getEffectiveSpeed(champB);

    if (aFirst) {
      // A ataca primer
      events.push(...resolveAttackStep(champA, champB, teamA, teamB, hpMap));
      if (champB.currentHp > 0) {
        // B contraataca
        events.push(...resolveAttackStep(champB, champA, teamA, teamB, hpMap));
      }
    } else {
      // B ataca primer
      events.push(...resolveAttackStep(champB, champA, teamA, teamB, hpMap));
      if (champA.currentHp > 0) {
        // A contraataca
        events.push(...resolveAttackStep(champA, champB, teamA, teamB, hpMap));
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

  const teamAWins = teamA.some((champion) => champion.currentHp > 0);

  if (teamAWins) {
    applyPostBattleBonuses(teamA);
    events.push({
      type: "end",
      message: "Team A WINS!",
      hpSnapshot: { ...hpMap },
    });
  } else {
    applyPostBattleBonuses(teamB);
    events.push({
      type: "end",
      message: "Team B WINS!",
      hpSnapshot: { ...hpMap },
    });
  }

  return { events, teamAWins, isDuel };
}
