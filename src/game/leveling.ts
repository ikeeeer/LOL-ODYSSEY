import type { Champion } from "./types";
import { GrowthCurve } from "./types";

type GrowthStat = "maxHp" | "attack" | "armor" | "speed" | "ap";
type GrowthCarry = Record<GrowthStat, number>;
type GrowthIncreases = Record<GrowthStat, number>;

// Els increments fraccionaris es guarden per campió i s'acumulen entre nivells.
// Sense això, els stats de base baixa (atac de Poppy, AP de Galio) arrodonien
// sempre a 0 i el campió no creixia mai en tota la partida.
const growthCarryByChampion = new WeakMap<Champion, GrowthCarry>();

// Pila d'increments aplicats, perquè levelDownChampion pugui revertir exactament
// el que va aplicar levelUpChampion (incloent-hi els residus fraccionaris).
const appliedIncreasesByChampion = new WeakMap<Champion, GrowthIncreases[]>();

function getGrowthMultiplier(currentLevel: number, growthCurve: GrowthCurve): number {
  const level = currentLevel; // Nivel actual (1-50)

  switch (growthCurve) {
    case GrowthCurve.Early:
      // Alto 1-16, bajo 17-50
      if (level <= 16) return 1.0;
      if (level <= 32) return 0.4;
      return 0.2;

    case GrowthCurve.Mid:
      // Bajo 1-16, alto 17-32, bajo 33-50
      if (level <= 16) return 0.3;
      if (level <= 32) return 1.0;
      return 0.3;

    case GrowthCurve.Late:
      // Bajo 1-32, alto 33-50
      if (level <= 32) return 0.2;
      return 1.0;

    case GrowthCurve.Flat:
      // Siempre igual
      return 0.5;

    case GrowthCurve.None:
      // Sin crecimiento
      return 0;

    default:
      return 0.5;
  }
}

function accumulateStatIncrease(
  champion: Champion,
  stat: GrowthStat,
  baseStat: number,
  growthCurve: GrowthCurve
): number {
  if (growthCurve === GrowthCurve.None) {
    return 0;
  }

  const multiplier = getGrowthMultiplier(champion.level, growthCurve);
  const baseIncrease = Math.ceil(baseStat * 0.05);
  let carry = growthCarryByChampion.get(champion);
  if (!carry) {
    carry = { maxHp: 0, attack: 0, armor: 0, speed: 0, ap: 0 };
    growthCarryByChampion.set(champion, carry);
  }

  carry[stat] += baseIncrease * multiplier;
  const wholeIncrease = Math.floor(carry[stat]);
  carry[stat] -= wholeIncrease;
  return wholeIncrease;
}

export function levelUpChampion(champion: Champion): void {
  champion.level += 1;

  // Calcular incrementos según el tipo de crecimiento
  const increases: GrowthIncreases = {
    maxHp: accumulateStatIncrease(champion, "maxHp", champion.maxHp, champion.hpGrowth),
    attack: accumulateStatIncrease(champion, "attack", champion.attack, champion.attackGrowth),
    armor: accumulateStatIncrease(champion, "armor", champion.armor, champion.defenseGrowth),
    speed: accumulateStatIncrease(champion, "speed", champion.speed, champion.speedGrowth),
    ap: accumulateStatIncrease(champion, "ap", champion.ap, champion.apGrowth),
  };

  const applied = appliedIncreasesByChampion.get(champion) ?? [];
  applied.push(increases);
  appliedIncreasesByChampion.set(champion, applied);

  // Aplicar incrementos
  champion.maxHp += increases.maxHp;
  // Si está vivo, aumentar currentHp. Si está muerto, no tocar currentHp para evitar ressuscitar
  if (champion.currentHp > 0) {
    champion.currentHp += increases.maxHp;
  }
  champion.attack += increases.attack;
  champion.armor += increases.armor;
  champion.magic_resist += increases.armor;  // defensGrowth augmenta tant armor com magic resist
  champion.speed += increases.speed;
  champion.ap += increases.ap;
}

export function levelDownChampion(champion: Champion): void {
  if (champion.level <= 1) {
    return;
  }

  // Reverteix exactament l'últim levelUp (o recalcula si no en tenim constància)
  const applied = appliedIncreasesByChampion.get(champion);
  const lastIncrease = applied?.pop();
  const hpDecrease = lastIncrease?.maxHp ?? accumulateStatIncrease(champion, "maxHp", champion.maxHp, champion.hpGrowth);
  const attackDecrease = lastIncrease?.attack ?? accumulateStatIncrease(champion, "attack", champion.attack, champion.attackGrowth);
  const defenseDecrease = lastIncrease?.armor ?? accumulateStatIncrease(champion, "armor", champion.armor, champion.defenseGrowth);
  const speedDecrease = lastIncrease?.speed ?? accumulateStatIncrease(champion, "speed", champion.speed, champion.speedGrowth);
  const apDecrease = lastIncrease?.ap ?? accumulateStatIncrease(champion, "ap", champion.ap, champion.apGrowth);

  champion.level -= 1;
  champion.maxHp = Math.max(1, champion.maxHp - hpDecrease);
  // Si estava viu, reduir currentHp proporcionalment
  if (champion.currentHp > 0) {
    champion.currentHp = Math.max(1, champion.currentHp - hpDecrease);
  }
  champion.currentHp = Math.min(champion.currentHp, champion.maxHp);
  champion.attack = Math.max(0, champion.attack - attackDecrease);
  champion.armor = Math.max(0, champion.armor - defenseDecrease);
  champion.magic_resist = Math.max(0, champion.magic_resist - defenseDecrease);
  champion.speed = Math.max(1, champion.speed - speedDecrease);
  champion.ap = Math.max(0, champion.ap - apDecrease);
}

export function levelUpTeam(team: Champion[], aliveAtStart?: Champion[]): void {
  team.forEach(champion => {
    // Si aliveAtStart está definido, solamente subir de nivel si el campeón estaba vivo al inicio y sigue vivo
    if (aliveAtStart && !aliveAtStart.some(c => c.id === champion.id)) {
      return; // No subir de nivel si no estaba vivo al inicio
    }
    // De otro modo, subir de nivel (incluso si está muerto ahora, siempre que estuviera vivo al inicio)
    levelUpChampion(champion);
  });
}

export function fullHealAndRevive(team: Champion[]): void {
  team.forEach(champion => {
    champion.currentHp = champion.maxHp;
  });
}

export function healTeam(team: Champion[], healPercent: number = 0.05): void {
  team.forEach(champion => {
    if (champion.currentHp > 0) {
      const healAmount = Math.floor(champion.maxHp * healPercent);
      champion.currentHp = Math.min(champion.maxHp, champion.currentHp + healAmount);
    }
  });
}
