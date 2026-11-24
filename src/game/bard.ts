import { createChampionInstance, DEMACIA_CHAMPIONS } from "./champions";
import { healTeam, levelDownChampion, levelUpTeam } from "./leveling";
import { getRandomBasicItem, getRandomLegendaryItem } from "./items";
import type { Champion, ChampionBase, InventoryItem, Region } from "./types";

export type BardOptionKey =
  | "lost-meep"
  | "misterious-portal"
  | "sacrifice"
  | "bards-melody"
  | "pass-of-time"
  | "old-age";

export interface BardOption {
  key: BardOptionKey;
  name: string;
}

export interface BardBattle {
  opponents: Champion[];
  isDuel: boolean;
}

export interface BardResolution {
  message: string;
  battle?: BardBattle;
  // Item obtingut (p. ex. del meep perdut) que el jugador ha de decidir si equipa o guarda.
  rewardItem?: InventoryItem;
}

interface BardRunContext {
  playerTeam: Champion[];
  region: Region;
  bag: InventoryItem[];
  addItemToBag(item: InventoryItem): void;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomPick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getChampionPool(region: Region): ChampionBase[] {
  return DEMACIA_CHAMPIONS.filter(champion => champion.region === region);
}

function getRandomChampionBase(region: Region): ChampionBase {
  const pool = getChampionPool(region);
  return { ...randomPick(pool) };
}

function getRandomChampionInstance(region: Region, targetLevel: number): Champion {
  const base = getRandomChampionBase(region);
  base.level = Math.max(1, targetLevel);
  return createChampionInstance(base);
}

function getStrongestChampion(team: Champion[]): Champion {
  return [...team].sort((left, right) => {
    const leftScore = left.level * 1000 + left.maxHp + left.attack + left.ap + left.armor + left.magic_resist + left.speed;
    const rightScore = right.level * 1000 + right.maxHp + right.attack + right.ap + right.armor + right.magic_resist + right.speed;
    return rightScore - leftScore;
  })[0];
}

function applyTeamPermanentStats(team: Champion[], hp: number, armor: number, magicResist: number, ap: number, attack: number): void {
  team.forEach(champion => {
    champion.maxHp += hp;
    champion.attack += attack;
    champion.ap += ap;
    champion.armor += armor;
    champion.magic_resist += magicResist;

    if (champion.currentHp > 0) {
      champion.currentHp += hp;
    }
  });
}

function applyMaxHpReduction(team: Champion[], percent: number): void {
  team.forEach(champion => {
    const reducedMaxHp = Math.max(1, Math.floor(champion.maxHp * (1 - percent)));
    champion.maxHp = reducedMaxHp;
    champion.currentHp = Math.min(champion.currentHp, reducedMaxHp);
  });
}

function getBardOptionsPool(): BardOption[] {
  return [
    { key: "lost-meep", name: "The lost meep" },
    { key: "misterious-portal", name: "Misterious Portal" },
    { key: "sacrifice", name: "Sacrifice" },
    { key: "bards-melody", name: "Bard's melody" },
    { key: "pass-of-time", name: "The pass of time" },
    { key: "old-age", name: "Old age" }
  ];
}

export function getBardNodeOptions(): BardOption[] {
  return shuffle(getBardOptionsPool()).slice(0, 3).map(option => ({ ...option }));
}

export async function resolveBardOption(
  option: BardOption,
  run: BardRunContext,
  nodeDepth: number,
  selectedChampion?: Champion
): Promise<BardResolution> {
  const opponentLevel = Math.max(1, nodeDepth);

  switch (option.key) {
    case "lost-meep": {
      if (Math.random() < 0.7) {
        const reward = getRandomBasicItem();
        return {
          message: `You saved the meep and gained ${reward.name}.`,
          rewardItem: reward
        };
      }

      return {
        message: "The meep fought back and a duel awaits you.",
        battle: {
          opponents: [getRandomChampionInstance(run.region, opponentLevel)],
          isDuel: true
        }
      };
    }
    case "misterious-portal": {
      if (Math.random() < 0.5) {
        healTeam(run.playerTeam, 0.5);
        return { message: "The portal healed a significant portion of your team." };
      }

      return {
        message: "The portal brought you to a special combat.",
        battle: {
          opponents: [getRandomChampionInstance(run.region, opponentLevel + 2)],
          isDuel: false
        }
      };
    }
    case "sacrifice": {
      const strongestChampion = getStrongestChampion(run.playerTeam);
      for (let index = 0; index < 3; index += 1) {
        levelDownChampion(strongestChampion);
      }

      const reward = getRandomLegendaryItem();
      run.addItemToBag(reward);
      return {
        message: `Bard sacrifices ${strongestChampion.name} and grants you ${reward.name}.`
      };
    }
    case "bards-melody": {
      const melody = randomPick([
        "harmonia",
        "valor",
        "ambicio"
      ] as const);

      if (melody === "harmonia") {
        applyTeamPermanentStats(run.playerTeam, 10, 0, 0, 0, 0);
        return { message: "Bard plays Harmony: the whole team gains +10 HP permanently." };
      }

      if (melody === "valor") {
        applyTeamPermanentStats(run.playerTeam, 0, 5, 5, 0, 0);
        return { message: "Bard plays Valor: the whole team gains +5 armor and +5 magic resist permanently." };
      }

      applyTeamPermanentStats(run.playerTeam, 0, 0, 0, 5, 5);
      return { message: "Bard plays Ambition: the whole team gains +5 AP and +5 attack permanently." };
    }
    case "pass-of-time": {
      if (!selectedChampion) {
        return { message: "You must choose a champion from your team for the pass of time." };
      }

      const targetIndex = run.playerTeam.findIndex(champion => champion.id === selectedChampion.id);
      if (targetIndex === -1) {
        return { message: "Could not find the selected champion." };
      }

      const replacement = getRandomChampionBase(run.region);
      replacement.level = Math.max(1, selectedChampion.level + 3);
      const newChampion = createChampionInstance(replacement);
      run.playerTeam[targetIndex] = newChampion;

      return { message: `${selectedChampion.name} has been replaced by ${newChampion.name} with +3 levels.` };
    }
    case "old-age": {
      levelUpTeam(run.playerTeam);
      levelUpTeam(run.playerTeam);
      levelUpTeam(run.playerTeam);
      levelUpTeam(run.playerTeam);
      applyMaxHpReduction(run.playerTeam, 0.2);
      return { message: "Time passes: the whole team gains 4 levels but loses 20% max HP." };
    }
  }
}