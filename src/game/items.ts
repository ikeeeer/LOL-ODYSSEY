import { levelUpChampion } from "./leveling";
import type { Champion, InventoryItem } from "./types";
import { DamageType, ItemPassiveType } from "./types";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getPassiveName(passive: ItemPassiveType): string {
  return passive;
}

function getPassiveDescription(passive: ItemPassiveType): string {
  const descriptions: Record<ItemPassiveType, string> = {
    "Fiora": "Cada tercer atac suma dany extra.",
    "Jarvan IV": "Cada segon atac aplica un drenatge de vida màxima.",
    "Lux": "Cada quart atac fa una explosió de dany extra.",
    "Vayne": "Cada tercer atac converteix el cop en dany directe basat en atac.",
    "Quinn": "Cada segon atac redueix armor i MR de l'enemic.",
    "Locke": "Cada segon atac redueix la speed de l'enemic.",
    "Sylas": "Cada tercer atac roba AP temporal i el converteix en dany.",
    "Xin Zhao": "Cada quart atac fa un burst i cura el campió.",
    "Lucian": "Cada tercer atac dispara un segon tret.",
    "Morgana": "El campió es cura una part del dany que fa.",
    "Galio": "Redueix el dany màgic rebut.",
    "Garen": "Regenera vida després de rebre el cop.",
    "Poppy": "S'endureix progressivament quan rep atacs.",
    "Shyvana": "Després del combat guanya armadura i MR permanents."
  };

  return descriptions[passive];
}

function getRandomItemPassive(): ItemPassiveType {
  const passives: ItemPassiveType[] = [
    "Fiora",
    "Jarvan IV",
    "Lux",
    "Vayne",
    "Quinn",
    "Locke",
    "Sylas",
    "Xin Zhao",
    "Lucian",
    "Morgana",
    "Galio",
    "Garen",
    "Poppy",
    "Shyvana"
  ];

  return randomPick(passives);
}

function resetCopiedPassiveState(champion: Champion): void {
  delete champion.attackCounter;
  delete champion.sonaCounter;
  delete champion.receivedAttackCounter;
}

function getStatLabel(stat: "attack" | "ap" | "maxHp" | "armor" | "magic_resist" | "speed"): string {
  if (stat === "attack") {
    return "atac";
  }

  if (stat === "ap") {
    return "AP";
  }

  if (stat === "maxHp") {
    return "health";
  }

  if (stat === "armor") {
    return "armor";
  }

  if (stat === "magic_resist") {
    return "magic resist";
  }

  return "speed";
}

function buildDamageTypeItem(): InventoryItem {
  return {
    id: "damage-type-shifter",
    name: "Damage Shifter",
    description: "Canvia el tipus de dany del campió que l'equipa.",
    effect: { type: "damageTypeChoice" }
  };
}

function buildRandomPassiveItem(): InventoryItem {
  const passive = getRandomItemPassive();

  return {
    id: `random-passive-${passive}`,
    name: `${passive} Relic`,
    description: getPassiveDescription(passive),
    effect: { type: "passive", passive }
  };
}

function createBaseObjects(): InventoryItem[] {
  return [
  {
    id: "long-sword",
    name: "Long Sword",
    description: "+10 atac.",
    effect: { type: "stat", stat: "attack", amount: 10 }
  },
  {
    id: "magic-tome",
    name: "Magic Tome",
    description: "+10 AP.",
    effect: { type: "stat", stat: "ap", amount: 10 }
  },
  {
    id: "ruby-crystal",
    name: "Ruby Crystal",
    description: "+5 health.",
    effect: { type: "stat", stat: "maxHp", amount: 5 }
  },
  {
    id: "cloth-armor",
    name: "Cloth Armor",
    description: "+5 armor.",
    effect: { type: "stat", stat: "armor", amount: 5 }
  },
  {
    id: "null-magic-mantle",
    name: "Null Magic Mantle",
    description: "+5 magic resist.",
    effect: { type: "stat", stat: "magic_resist", amount: 5 }
  },
  {
    id: "dagger",
    name: "Dagger",
    description: "+5% speed.",
    effect: { type: "percentStat", stat: "speed", percent: 5 }
  },
  {
    id: "level-core",
    name: "+1 level",
    description: "Consumible: puja un nivell al campió triat.",
    effect: { type: "level", amount: 1 }
  },
  buildDamageTypeItem(),
  buildRandomPassiveItem()
  ];
}

export function getObjectNodeOptions(): InventoryItem[] {
  return shuffle(createBaseObjects()).slice(0, 3).map(item => ({ ...item }));
}

export function formatItemEffect(item: InventoryItem): string {
  switch (item.effect.type) {
    case "stat":
      return `+${item.effect.amount} ${getStatLabel(item.effect.stat)}`;
    case "percentStat":
      return `+${item.effect.percent}% ${getStatLabel(item.effect.stat)}`;
    case "level":
      return `Consumible: +${item.effect.amount} nivell`;
    case "damageTypeChoice":
      return "Canvia el tipus de dany";
    case "passive":
      return `Passiva: ${item.effect.passive}`;
  }
}

export function canStoreInBag(item: InventoryItem): boolean {
  return true;
}

export function canEquipItem(champion: Champion, item: InventoryItem): boolean {
  if (item.effect.type === "level") {
    return true;
  }

  return !champion.equippedItemId;
}

export function applyItemToChampion(champion: Champion, item: InventoryItem, damageTypeTarget?: DamageType): string {
  if (item.effect.type !== "level" && champion.equippedItemId) {
    return `${champion.name} ja té un objecte equipat.`;
  }

  switch (item.effect.type) {
    case "stat":
      switch (item.effect.stat) {
        case "attack":
          champion.attack += item.effect.amount;
          break;
        case "ap":
          champion.ap += item.effect.amount;
          break;
        case "maxHp":
          champion.maxHp += item.effect.amount;
          champion.currentHp = Math.min(champion.maxHp, champion.currentHp + item.effect.amount);
          break;
        case "armor":
          champion.armor += item.effect.amount;
          break;
        case "magic_resist":
          champion.magic_resist += item.effect.amount;
          break;
        case "speed":
          champion.speed += item.effect.amount;
          break;
      }

      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      return `${champion.name} equipa ${item.name}.`;
    case "percentStat":
      if (item.effect.stat === "speed") {
        const bonus = Math.max(1, Math.floor(champion.speed * (item.effect.percent / 100)));
        champion.speed += bonus;
      }

      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      return `${champion.name} equipa ${item.name}.`;
    case "level":
      for (let index = 0; index < item.effect.amount; index += 1) {
        levelUpChampion(champion);
      }
      return `${champion.name} puja ${item.effect.amount} nivell.`;
    case "damageTypeChoice":
      if (damageTypeTarget === undefined) {
        return "Falta el tipus de dany de destí.";
      }

      champion.damageType = damageTypeTarget;
      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      return `${champion.name} canvia el tipus de dany.`;
    case "passive":
      champion.itemPassive = item.effect.passive;
      resetCopiedPassiveState(champion);
      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      return `${champion.name} obté la passiva ${getPassiveName(item.effect.passive)}.`;
  }
}