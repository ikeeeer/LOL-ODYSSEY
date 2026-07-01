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
    messages.push(`  🛡️ Sinergia Tank activada: +${tankArmorBonus} armor i +${tankMagicResistBonus} MR.`);
  }

  if (fighterAttackBonus > 0) {
    messages.push(`  ⚔️ Sinergia Fighter activada: +${fighterAttackBonus} atac.`);
  }

  if (assassinExecuteThreshold > 0) {
    messages.push(`  🗡️ Sinergia Assassin activada: execute al ${Math.floor(assassinExecuteThreshold * 100)}% de vida rival.`);
  }

  if (mageApBonus > 0) {
    messages.push(`  🔮 Sinergia Mage activada: +${mageApBonus} AP.`);
  }

  if (marksmanSpeedPercent > 0) {
    messages.push(`  🎯 Sinergia Marksman activada: +${Math.floor(marksmanSpeedPercent * 100)}% speed.`);
  }

  if (supportHealPercent > 0) {
    messages.push(`  💚 Sinergia Support activada: +${Math.floor(supportHealPercent * 100)}% healing després de ser atacat.`);
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
    if (champion.level >= 15) {
      attack += 5;
    }
    if (champion.level >= 50) {
      attack += 15;
    }
  }

  return attack;
}

export function getEffectiveAp(champion: Champion): number {
  let ap = champion.ap;

  if (champion.name === "Kayle" && champion.level >= 30) {
    ap += 10;
  }

  const state = getCombatState(champion);
  return ap + (state.combatApBonus || 0);
}

export function getDamageMultiplier(champion: Champion): number {
  const state = getCombatState(champion);
  return 1 + (state.combatDamageBonus || 0);
}

export function calculateCombatDamage(attacker: Champion, defender: Champion): number {
  let damage = 0;
  const effectiveArmor = getEffectiveArmor(defender);
  const effectiveMagicResist = getEffectiveMagicResist(defender);
  const attackMultiplier = getDamageMultiplier(attacker);

  switch (attacker.damageType) {
    case DamageType.Physical:
      damage = (getEffectiveAttack(attacker) * attackMultiplier) - (effectiveArmor * 0.2);
      break;
    case DamageType.Magical:
      damage = (getEffectiveAp(attacker) * attackMultiplier) - (effectiveMagicResist * 0.2);
      break;
    case DamageType.Mixed:
      const magicalDamage = (getEffectiveAp(attacker) * attackMultiplier - effectiveMagicResist * 0.2) * 0.6;
      const physicalDamage = (getEffectiveAttack(attacker) * attackMultiplier - effectiveArmor * 0.2) * 0.4;
      damage = magicalDamage + physicalDamage;
      break;
  }

  return Math.floor(Math.max(1, damage));
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

  team.forEach(champion => {
    const championState = getCombatState(champion);
    championState.combatDamageBonus = (championState.combatDamageBonus || 0) + 0.05;
  });

  return ["  ✨ Sona harmonitza l'equip: +5% de dany per a tothom aquest combat."];
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
    logMessages.push(`  ⚔️ ${attacker.name} marca un punt vital i suma ${bonus} extra.`);
  }

  if (attackerPassiveSource === "Jarvan IV" && (attackerState.attackCounter || 0) % 2 === 0) {
    const maxHpDrain = Math.floor(defender.maxHp * 0.05);
    damage += maxHpDrain;
    logMessages.push(`  🛡️ ${attacker.name} esquartera el rival i li lleva ${maxHpDrain} de vida màxima.`);
  }

  if (attackerPassiveSource === "Lux" && (attackerState.attackCounter || 0) % 4 === 0) {
    const burst = Math.floor(defender.maxHp * 0.12);
    damage += burst;
    logMessages.push(`  ✨ ${attacker.name} llança una explosió de llum: +${burst} de dany.`);
  }

  if (attackerPassiveSource === "Vayne" && (attackerState.attackCounter || 0) % 3 === 0) {
    damage = Math.max(1, getEffectiveAttack(attacker) + 3);
    logMessages.push(`  🎯 ${attacker.name} dispara amb precision mortal i ignora defenses.`);
  }

  if (attackerPassiveSource === "Quinn" && (attackerState.attackCounter || 0) % 2 === 0) {
    const armorReduction = Math.floor(getEffectiveArmor(defender) * 0.05);
    const mrReduction = Math.floor(getEffectiveMagicResist(defender) * 0.05);
    defenderState.combatArmorDebuff = (defenderState.combatArmorDebuff || 0) + armorReduction;
    defenderState.combatMagicResistDebuff = (defenderState.combatMagicResistDebuff || 0) + mrReduction;
    logMessages.push(`  🦅 ${attacker.name} desestabilitza el rival: -${armorReduction} armor i -${mrReduction} MR.`);
  }

  if (attackerPassiveSource === "Locke" && (attackerState.attackCounter || 0) % 2 === 0) {
    const speedReduction = Math.floor(getEffectiveSpeed(defender) * 0.05);
    defenderState.combatSpeedDebuff = (defenderState.combatSpeedDebuff || 0) + speedReduction;
    logMessages.push(`  ⚡ ${attacker.name} esmuny el ritme rival: -${speedReduction} speed.`);
  }

  if (attackerPassiveSource === "Sylas" && (attackerState.attackCounter || 0) % 3 === 0) {
    const stolenAp = Math.floor(defender.ap * 0.1);
    attackerState.combatApBonus = (attackerState.combatApBonus || 0) + stolenAp;
    damage += Math.max(1, Math.floor(stolenAp * 0.5));
    logMessages.push(`  🧠 ${attacker.name} roba ${stolenAp} AP temporal i converteix el poder en dany.`);
  }

  if (attackerPassiveSource === "Xin Zhao" && (attackerState.attackCounter || 0) % 4 === 0) {
    const burst = Math.floor(baseDamage * 0.25);
    const healAmount = Math.max(1, Math.floor(attacker.maxHp * 0.03));
    damage += burst;
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
    logMessages.push(`  🐉 ${attacker.name} carrega amb ferocitat: +${burst} de dany i ${healAmount} de curació.`);
  }

  if (attackerPassiveSource === "Lucian" && (attackerState.attackCounter || 0) % 3 === 0) {
    damage += baseDamage;
    logMessages.push(`  🔫 ${attacker.name} dispara en cadena amb un segon tret.`);
  }

  if (attackerPassiveSource === "Morgana") {
    const heal = Math.floor(baseDamage * 0.1);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
    logMessages.push(`  🌙 ${attacker.name} es cura ${heal} per la seva ombra.`);
  }

  if (attackerState.combatExecuteThreshold && defender.currentHp <= Math.floor(defender.maxHp * attackerState.combatExecuteThreshold)) {
    damage = defender.currentHp;
    logMessages.push(`  🗡️ ${attacker.name} executa el rival sota el llindar de vida.`);
  }

  if (attackerPassiveSource === "Sona") {
    const state = getCombatState(attacker);
    state.sonaCounter = (state.sonaCounter || 0) + 1;

    if ((state.sonaCounter || 0) % 2 === 0) {
      teamBuffFromSona(attacker, logMessages);
    }
  }

  if (defenderPassiveSource === "Galio" && attacker.damageType === DamageType.Magical) {
    const reduced = Math.floor(baseDamage * 0.2);
    damage -= reduced;
    logMessages.push(`  🛡️ ${defender.name} absorbeix ${reduced} de dany màgic.`);
  }

  if (defenderPassiveSource === "Garen") {
    const heal = Math.floor(defender.maxHp * 0.05);
    defender.currentHp = Math.min(defender.maxHp, defender.currentHp + heal);
    logMessages.push(`  🪖 ${defender.name} regenera ${heal} de vida després de rebre el cop.`);
  }

  if (defenderPassiveSource === "Poppy") {
    defenderState.receivedAttackCounter = (defenderState.receivedAttackCounter || 0) + 1;
    if ((defenderState.receivedAttackCounter || 0) % 2 === 0) {
      const armorBonus = Math.floor(defender.armor * 0.05);
      const mrBonus = Math.floor(defender.magic_resist * 0.05);
      defenderState.combatArmorBonus = (defenderState.combatArmorBonus || 0) + armorBonus;
      defenderState.combatMagicResistBonus = (defenderState.combatMagicResistBonus || 0) + mrBonus;
      logMessages.push(`  🛡️ ${defender.name} s'endureix: +${armorBonus} armor i +${mrBonus} MR.`);
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
  logMessages.push(`  ✨ ${attacker.name} harmonitza l'equip: +5% de dany per a tothom aquest combat.`);
}

export function applyPostBattleBonuses(team: Team): string[] {
  const messages: string[] = [];

  team.forEach(champion => {
    if (champion.name === "Shyvana") {
      champion.armor += 2;
      champion.magic_resist += 2;
      messages.push(`  🐉 ${champion.name} guanya +2 armor i +2 MR permanents.`);
    }

    if (champion.itemPassive === "Shyvana") {
      champion.armor += 2;
      champion.magic_resist += 2;
      messages.push(`  🐉 ${champion.name} activa la passiva de Shyvana i guanya +2 armor i +2 MR permanents.`);
    }
  });

  return messages;
}
