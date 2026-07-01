import { Champion, GrowthCurve } from "./types";

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

function calculateStatIncrease(baseStat: number, growthCurve: GrowthCurve, currentLevel: number): number {
  const multiplier = getGrowthMultiplier(currentLevel, growthCurve);
  const baseIncrease = Math.ceil(baseStat * 0.05); // 5% del stat base
  return Math.floor(baseIncrease * multiplier);
}

export function levelUpChampion(champion: Champion): void {
  champion.level += 1;

  // Calcular incrementos según el tipo de crecimiento
  const hpIncrease = calculateStatIncrease(champion.maxHp, champion.hpGrowth, champion.level);
  const attackIncrease = calculateStatIncrease(champion.attack, champion.attackGrowth, champion.level);
  const defenseIncrease = calculateStatIncrease(champion.armor, champion.defenseGrowth, champion.level);
  const speedIncrease = calculateStatIncrease(champion.speed, champion.speedGrowth, champion.level);
  const apIncrease = calculateStatIncrease(champion.ap, champion.apGrowth, champion.level);

  // Aplicar incrementos
  champion.maxHp += hpIncrease;
  // Si está vivo, aumentar currentHp. Si está muerto, no tocar currentHp para evitar ressuscitar
  if (champion.currentHp > 0) {
    champion.currentHp += hpIncrease;
  }
  champion.attack += attackIncrease;
  champion.armor += defenseIncrease;
  champion.magic_resist += defenseIncrease;  // defensGrowth augmenta tant armor com magic resist
  champion.speed += speedIncrease;
  champion.ap += apIncrease;
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
