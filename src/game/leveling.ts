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
  const defenseIncrease = calculateStatIncrease(champion.defense, champion.defenseGrowth, champion.level);
  const speedIncrease = calculateStatIncrease(champion.speed, champion.speedGrowth, champion.level);

  // Aplicar incrementos
  champion.maxHp += hpIncrease;
  champion.attack += attackIncrease;
  champion.defense += defenseIncrease;
  champion.speed += speedIncrease;

  // Restaurar HP actual al máximo después de subir de nivel
  champion.currentHp = champion.maxHp;
}

export function levelUpTeam(team: Champion[]): void {
  team.forEach(champion => {
    if (champion.currentHp > 0) {
      levelUpChampion(champion);
    }
  });
}

export function healTeam(team: Champion[], healPercent: number = 0.5): void {
  team.forEach(champion => {
    if (champion.currentHp > 0) {
      const healAmount = Math.floor(champion.maxHp * healPercent);
      champion.currentHp = Math.min(champion.maxHp, champion.currentHp + healAmount);
    }
  });
}
