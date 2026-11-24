import type { Champion, Team } from "./types";
import { DamageType, Role } from "./types";

type CombatChampion = Champion & {
  attackCounter?: number;
  sonaCounter?: number;
  receivedAttackCounter?: number;
  combatAttackBonus?: number;
  combatArmorBonus?: number;
  combatMagicResistBonus?: number;
  combatArmorDebuff?: number;
  combatMagicResistDebuff?: number;
  combatSpeedDebuff?: number;
  combatSpeedBonus?: number;
  combatDamageBonus?: number;
  combatApBonus?: number;
  combatExecuteThreshold?: number;
  combatSupportHealPercent?: number;
};

function getCombatState(champion: Champion): CombatChampion {
  return champion as CombatChampion;
}

function getPassiveSource(champion: Champion): string {
  return champion.itemPassive || champion.name;
}

export function resetCombatState(team: Team): void {
  team.forEach(champion => {
    const state = getCombatState(champion);
    delete state.attackCounter;
    delete state.sonaCounter;
    delete state.receivedAttackCounter;
    delete state.combatAttackBonus;
    delete state.combatArmorBonus;
    delete state.combatMagicResistBonus;
    delete state.combatArmorDebuff;
    delete state.combatMagicResistDebuff;
    delete state.combatSpeedDebuff;
    delete state.combatSpeedBonus;
    delete state.combatDamageBonus;
    delete state.combatApBonus;
    delete state.combatExecuteThreshold;
    delete state.combatSupportHealPercent;
  });
}

function getRoleCount(team: Team, role: Role): number {
  return team.filter(champion => champion.role === role).length;
}

export function applyTeamSynergies(team: Team): string[] {
  const messages: string[] = [];
  const tankCount = getRoleCount(team, Role.Tank);
  const fighterCount = getRoleCount(team, Role.Fighter);
  const assassinCount = getRoleCount(team, Role.Assassin);
  const mageCount = getRoleCount(team, Role.Mage);
  const marksmanCount = getRoleCount(team, Role.Marksman);
  const supportCount = getRoleCount(team, Role.Support);

  const tankArmorBonus = tankCount >= 4 ? 10 : tankCount >= 2 ? 5 : 0;
  const tankMagicResistBonus = tankCount >= 4 ? 10 : tankCount >= 2 ? 5 : 0;
  const fighterAttackBonus = fighterCount >= 4 ? 20 : fighterCount >= 2 ? 10 : 0;
  const assassinExecuteThreshold = assassinCount >= 4 ? 0.10 : assassinCount >= 2 ? 0.05 : 0;
  const mageApBonus = mageCount >= 4 ? 20 : mageCount >= 2 ? 10 : 0;
  const marksmanSpeedPercent = marksmanCount >= 4 ? 0.10 : marksmanCount >= 2 ? 0.05 : 0;
  const supportHealPercent = supportCount >= 4 ? 0.10 : supportCount >= 2 ? 0.05 : 0;

  if (tankArmorBonus > 0) {
    messages.push(`  🛡️ Tank synergy activated: +${tankArmorBonus} armor and +${tankMagicResistBonus} MR.`);
  }

  if (fighterAttackBonus > 0) {
    messages.push(`  ⚔️ Fighter synergy activated: +${fighterAttackBonus} attack.`);
  }

  if (assassinExecuteThreshold > 0) {
    messages.push(`  🗡️ Assassin synergy activated: execute at ${Math.floor(assassinExecuteThreshold * 100)}% enemy HP.`);
  }

  if (mageApBonus > 0) {
    messages.push(`  🔮 Mage synergy activated: +${mageApBonus} AP.`);
  }

  if (marksmanSpeedPercent > 0) {
    messages.push(`  🎯 Marksman synergy activated: +${Math.floor(marksmanSpeedPercent * 100)}% speed.`);
  }

  if (supportHealPercent > 0) {
    messages.push(`  💚 Support synergy activated: +${Math.floor(supportHealPercent * 100)}% healing after being attacked.`);
  }

  team.forEach(champion => {
    const state = getCombatState(champion);

    if (tankArmorBonus > 0) {
      state.combatArmorBonus = (state.combatArmorBonus || 0) + tankArmorBonus;
      state.combatMagicResistBonus = (state.combatMagicResistBonus || 0) + tankMagicResistBonus;
    }

    if (fighterAttackBonus > 0) {
      state.combatAttackBonus = (state.combatAttackBonus || 0) + fighterAttackBonus;
    }

    if (assassinExecuteThreshold > 0) {
      state.combatExecuteThreshold = Math.max(state.combatExecuteThreshold || 0, assassinExecuteThreshold);
    }

    if (mageApBonus > 0) {
      state.combatApBonus = (state.combatApBonus || 0) + mageApBonus;
    }

    if (marksmanSpeedPercent > 0) {
      const speedBonus = Math.max(1, Math.ceil(champion.speed * marksmanSpeedPercent));
      state.combatSpeedBonus = (state.combatSpeedBonus || 0) + speedBonus;
    }

    if (supportHealPercent > 0) {
      state.combatSupportHealPercent = Math.max(state.combatSupportHealPercent || 0, supportHealPercent);
    }
  });

  return messages;
}

export function getEffectiveArmor(champion: Champion): number {
  const state = getCombatState(champion);
  return Math.max(0, champion.armor + (state.combatArmorBonus || 0) - (state.combatArmorDebuff || 0));
}

export function getEffectiveMagicResist(champion: Champion): number {
  const state = getCombatState(champion);
  return Math.max(0, champion.magic_resist + (state.combatMagicResistBonus || 0) - (state.combatMagicResistDebuff || 0));
}

export function getEffectiveSpeed(champion: Champion): number {
  const state = getCombatState(champion);
  return Math.max(1, champion.speed + (state.combatSpeedBonus || 0) - (state.combatSpeedDebuff || 0));
}

export function getEffectiveAttack(champion: Champion): number {
  const state = getCombatState(champion);
  let attack = champion.attack + (state.combatAttackBonus || 0);

  if (champion.name === "Kayle") {
    if (champion.isBoss) {
      if (champion.level >= 15) {
        attack += 10;
      }
      if (champion.level >= 50) {
        attack += 20;
      }
    } else {
      if (champion.level >= 15) {
        attack += 5;
      }
      if (champion.level >= 50) {
        attack += 15;
      }
    }
  }

  return attack;
}

export function getEffectiveAp(champion: Champion): number {
  let ap = champion.ap;

  if (champion.name === "Kayle") {
    if (champion.isBoss) {
      if (champion.level >= 30) {
        ap += 15;
      }
    } else if (champion.level >= 30) {
      ap += 10;
    }
  }

  const state = getCombatState(champion);
  return ap + (state.combatApBonus || 0);
}

export function getDamageMultiplier(champion: Champion): number {
  const state = getCombatState(champion);
  return 1 + (state.combatDamageBonus || 0);
}

// Resistances use a multiplicative mitigation curve instead of a flat subtraction,
// so armor/MR keep mattering at every level: 0 resist = full damage, 50 resist = 1/3.
const RESIST_MITIGATION_CONSTANT = 50;

// Every level of difference between attacker and defender shifts damage by 1.5%,
// clamped so extreme level gaps stay playable.
const LEVEL_DAMAGE_BONUS_PER_LEVEL = 0.015;
const MIN_LEVEL_DAMAGE_MULTIPLIER = 0.65;
const MAX_LEVEL_DAMAGE_MULTIPLIER = 1.3;

function getResistMultiplier(resist: number): number {
  const effectiveResist = Math.max(0, resist);
  return RESIST_MITIGATION_CONSTANT / (RESIST_MITIGATION_CONSTANT + effectiveResist);
}

export function getLevelDamageMultiplier(attacker: Champion, defender: Champion): number {
  const levelDifference = attacker.level - defender.level;
  const multiplier = 1 + levelDifference * LEVEL_DAMAGE_BONUS_PER_LEVEL;
  return Math.min(MAX_LEVEL_DAMAGE_MULTIPLIER, Math.max(MIN_LEVEL_DAMAGE_MULTIPLIER, multiplier));
}

export function calculateCombatDamage(attacker: Champion, defender: Champion): number {
  const effectiveArmor = getEffectiveArmor(defender);
  const effectiveMagicResist = getEffectiveMagicResist(defender);
  const attackMultiplier = getDamageMultiplier(attacker);
  const levelMultiplier = getLevelDamageMultiplier(attacker, defender);

  const physicalDamage = getEffectiveAttack(attacker) * getResistMultiplier(effectiveArmor);
  const magicalDamage = getEffectiveAp(attacker) * getResistMultiplier(effectiveMagicResist);

  let damage = 0;
  switch (attacker.damageType) {
    case DamageType.Physical:
      damage = physicalDamage;
      break;
    case DamageType.Magical:
      damage = magicalDamage;
      break;
    case DamageType.Mixed:
      damage = magicalDamage * 0.6 + physicalDamage * 0.4;
      break;
  }

  return Math.floor(Math.max(1, damage * attackMultiplier * levelMultiplier));
}

export function applySonaBuff(team: Team, attacker: Champion): string[] {
  if (attacker.name !== "Sona") {
    return [];
  }

  const state = getCombatState(attacker);
  state.sonaCounter = (state.sonaCounter || 0) + 1;

  if ((state.sonaCounter || 0) % 2 !== 0) {
    return [];
  }

  if (attacker.isBoss) {
    team.forEach(champion => {
      const championState = getCombatState(champion);
      championState.combatDamageBonus = (championState.combatDamageBonus || 0) + 0.10;
    });

    return ["  ✨ Sona boss harmonizes the team: +10% damage for everyone this combat."];
  }

  team.forEach(champion => {
    const championState = getCombatState(champion);
    championState.combatDamageBonus = (championState.combatDamageBonus || 0) + 0.05;
  });

  return ["  ✨ Sona harmonizes the team: +5% damage for everyone this combat."];
}

export interface PassiveResult {
  damage: number;
  logMessages: string[];
}

export function applyCombatPassives(attacker: Champion, defender: Champion, baseDamage: number): PassiveResult {
  const attackerState = getCombatState(attacker);
  const defenderState = getCombatState(defender);
  const attackerPassiveSource = getPassiveSource(attacker);
  const defenderPassiveSource = getPassiveSource(defender);
  let damage = baseDamage;
  const logMessages: string[] = [];

  attackerState.attackCounter = (attackerState.attackCounter || 0) + 1;

  if (attackerPassiveSource === "Fiora" && (attackerState.attackCounter || 0) % 3 === 0) {
    const bonus = Math.floor(baseDamage * 0.25);
    damage += bonus;
    logMessages.push(`  ⚔️ ${attacker.name} strikes a vital point and adds ${bonus} extra.`);
  }

  if (attackerPassiveSource === "Jarvan IV" && (attackerState.attackCounter || 0) % 2 === 0) {
    const maxHpDrain = Math.floor(defender.maxHp * (attacker.isBoss ? 0.1 : 0.05));
    damage += maxHpDrain;
    logMessages.push(`  🛡️ ${attacker.name} sunders the enemy and removes ${maxHpDrain} max HP.`);
  }

  if (attackerPassiveSource === "Lux" && (attackerState.attackCounter || 0) % 4 === 0) {
    const burst = Math.floor(defender.maxHp * (attacker.isBoss ? 0.2 : 0.12));
    damage += burst;
    logMessages.push(`  ✨ ${attacker.name} unleashes a burst of light: +${burst} damage.`);
  }

  if (attackerPassiveSource === "Vayne" && (attackerState.attackCounter || 0) % 3 === 0) {
    damage = Math.max(1, getEffectiveAttack(attacker) + 3);
    logMessages.push(`  🎯 ${attacker.name} fires with deadly precision and ignores defenses.`);
  }

  if (attackerPassiveSource === "Quinn" && (attackerState.attackCounter || 0) % 2 === 0) {
    const reductionPercent = attacker.isBoss ? 0.15 : 0.05;
    const armorReduction = Math.max(1, Math.floor(getEffectiveArmor(defender) * reductionPercent));
    const mrReduction = Math.max(1, Math.floor(getEffectiveMagicResist(defender) * reductionPercent));
    defenderState.combatArmorDebuff = (defenderState.combatArmorDebuff || 0) + armorReduction;
    defenderState.combatMagicResistDebuff = (defenderState.combatMagicResistDebuff || 0) + mrReduction;
    logMessages.push(`  🦅 ${attacker.name} destabilizes the enemy: -${armorReduction} armor and -${mrReduction} MR.`);
  }

  if (attackerPassiveSource === "Locke" && (attackerState.attackCounter || 0) % 2 === 0) {
    const speedReduction = Math.floor(getEffectiveSpeed(defender) * 0.05);
    defenderState.combatSpeedDebuff = (defenderState.combatSpeedDebuff || 0) + speedReduction;
    logMessages.push(`  ⚡ ${attacker.name} disrupts the enemy's rhythm: -${speedReduction} speed.`);
  }

  if (attackerPassiveSource === "Sylas" && (attackerState.attackCounter || 0) % 3 === 0) {
    const stolenApPercent = attacker.isBoss ? 0.15 : 0.1;
    const damageConversionPercent = attacker.isBoss ? 0.75 : 0.5;
    const stolenAp = Math.floor(defender.ap * stolenApPercent);
    attackerState.combatApBonus = (attackerState.combatApBonus || 0) + stolenAp;
    damage += Math.max(1, Math.floor(stolenAp * damageConversionPercent));
    logMessages.push(`  🧠 ${attacker.name} steals ${stolenAp} temporary AP and converts it to damage.`);
  }

  if (attackerPassiveSource === "Xin Zhao" && (attackerState.attackCounter || 0) % 4 === 0) {
    const burst = Math.floor(baseDamage * 0.25);
    const healAmount = Math.max(1, Math.floor(attacker.maxHp * 0.03));
    damage += burst;
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
    logMessages.push(`  🐉 ${attacker.name} charges with ferocity: +${burst} damage and ${healAmount} healing.`);
  }

  if (attackerPassiveSource === "Lucian" && (attackerState.attackCounter || 0) % 3 === 0) {
    damage += baseDamage;
    logMessages.push(`  🔫 ${attacker.name} fires in a chain with a second shot.`);
  }

  if (attackerPassiveSource === "Morgana") {
    const heal = Math.floor(baseDamage * 0.1);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
    logMessages.push(`  🌙 ${attacker.name} heals ${heal} through shadow.`);
  }

  if (attackerState.combatExecuteThreshold && defender.currentHp <= Math.floor(defender.maxHp * attackerState.combatExecuteThreshold)) {
    damage = defender.currentHp;
    logMessages.push(`  🗡️ ${attacker.name} executes the enemy below the HP threshold.`);
  }

  if (defenderPassiveSource === "Galio" && attacker.damageType === DamageType.Magical) {
    const reducedPercent = defender.isBoss ? 0.4 : 0.2;
    const reduced = Math.floor(baseDamage * reducedPercent);
    damage -= reduced;
    logMessages.push(`  🛡️ ${defender.name} absorbs ${reduced} magic damage.`);
  }

  if (defenderPassiveSource === "Garen") {
    const heal = Math.floor(defender.maxHp * (defender.isBoss ? 0.1 : 0.05));
    defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
    logMessages.push(`  🪖 ${defender.name} regenerates ${heal} HP after being hit.`);
  }

  if (defender.isBoss && defenderPassiveSource === "Poppy") {
    defenderState.receivedAttackCounter = (defenderState.receivedAttackCounter || 0) + 1;

    if ((defenderState.receivedAttackCounter || 0) % 2 === 0) {
      const armorBonus = Math.max(1, Math.floor(defender.armor * 0.1));
      const mrBonus = Math.max(1, Math.floor(defender.magic_resist * 0.1));
      defenderState.combatArmorBonus = (defenderState.combatArmorBonus || 0) + armorBonus;
      defenderState.combatMagicResistBonus = (defenderState.combatMagicResistBonus || 0) + mrBonus;
      logMessages.push(`  🛡️ ${defender.name} hardens: +${armorBonus} armor and +${mrBonus} MR.`);
    }
  }

  return {
    damage: Math.max(1, damage),
    logMessages
  };
}

function teamBuffFromSona(attacker: Champion, logMessages: string[]): void {
  const state = getCombatState(attacker);
  state.combatDamageBonus = (state.combatDamageBonus || 0) + 0.05;
  logMessages.push(`  ✨ ${attacker.name} harmonizes the team: +5% damage for everyone this combat.`);
}
void teamBuffFromSona;

export function applyPostBattleBonuses(team: Team): string[] {
  const messages: string[] = [];

  team.forEach(champion => {
    if (champion.name === "Shyvana") {
      champion.armor += 2;
      champion.magic_resist += 2;
      messages.push(`  🐉 ${champion.name} gains +2 armor and +2 MR permanently.`);
    }

    if (champion.itemPassive === "Shyvana") {
      champion.armor += 2;
      champion.magic_resist += 2;
      messages.push(`  🐉 ${champion.name} activates Shyvana's passive and gains +2 armor and +2 MR permanently.`);
    }
  });

  return messages;
}
