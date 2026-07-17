import { levelUpChampion } from "./leveling";
import type { Champion, InventoryItem } from "./types";
import { DamageType } from "./types";
import type { ItemPassiveType } from "./types";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getPassiveName(passive: ItemPassiveType): string {
  return passive;
}

export function getPassiveDescription(passive: ItemPassiveType): string {
  const descriptions: Record<ItemPassiveType, string> = {
    "Fiora": "Every third attack deals bonus damage.",
    "Jarvan IV": "Every second attack applies max HP drain.",
    "Lux": "Every fourth attack causes a burst of extra damage.",
    "Vayne": "Every third attack converts the hit to direct damage based on attack.",
    "Quinn": "Every second attack reduces enemy armor and MR by 5%.",
    "Locke": "Every second attack reduces enemy speed.",
    "Sylas": "Every third attack steals temporary AP and converts it to damage.",
    "Xin Zhao": "Every fourth attack bursts and heals the champion.",
    "Lucian": "Every third attack fires a second shot.",
    "Morgana": "The champion heals a portion of damage dealt.",
    "Galio": "Reduces magic damage taken.",
    "Garen": "Regenerates health after being hit.",
    "Poppy": "Progressively hardens when taking attacks.",
    "Shyvana": "After combat gains permanent armor and MR."
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
    description: "Changes the damage type of the champion who equips it.",
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

function createLegendaryItems(): InventoryItem[] {
  return [
    {
      id: "infinity-edge",
      name: "Infinity Edge",
      description: "+20 atac.",
      effect: { type: "stat", stat: "attack", amount: 20 }
    },
    {
      id: "ludens-echo",
      name: "Luden's Echo",
      description: "+20 AP.",
      effect: { type: "stat", stat: "ap", amount: 20 }
    },
    {
      id: "warmogs-armor",
      name: "Warmog's Armor",
      description: "+15 health.",
      effect: { type: "stat", stat: "maxHp", amount: 15 }
    },
    {
      id: "sunfire-cape",
      name: "Sunfire Cape",
      description: "+15 armor.",
      effect: { type: "stat", stat: "armor", amount: 15 }
    },
    {
      id: "force-of-nature",
      name: "Force of Nature",
      description: "+15 armor.",
      effect: { type: "stat", stat: "armor", amount: 15 }
    },
    {
      id: "phantom-dancer",
      name: "Phantom Dancer",
      description: "+10% speed.",
      effect: { type: "percentStat", stat: "speed", percent: 10 }
    }
  ];
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
    description: "Consumable: levels up the chosen champion.",
    effect: { type: "level", amount: 1 }
  },
  buildDamageTypeItem(),
  buildRandomPassiveItem()
  ];
}

export function getObjectNodeOptions(): InventoryItem[] {
  return shuffle(createBaseObjects()).slice(0, 3).map(item => ({ ...item }));
}

export function getRandomLegendaryItem(): InventoryItem {
  return { ...randomPick(createLegendaryItems()) };
}

export function getRandomBasicItem(): InventoryItem {
  const baseItems = createBaseObjects().filter(item => item.effect.type === "stat");
  return { ...randomPick(baseItems) };
}

export function formatItemEffect(item: InventoryItem): string {
  switch (item.effect.type) {
    case "stat":
      return `+${item.effect.amount} ${getStatLabel(item.effect.stat)}`;
    case "percentStat":
      return `+${item.effect.percent}% ${getStatLabel(item.effect.stat)}`;
    case "level":
      return `Consumable: +${item.effect.amount} level`;
    case "damageTypeChoice":
      return "Changes damage type";
    case "passive":
      return `Passiva: ${item.effect.passive}`;
  }
}

export function canStoreInBag(_item: InventoryItem): boolean {
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
    return `${champion.name} already has an item equipped.`;
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
      champion.equippedItemEffect = item.effect;
      return `${champion.name} equips ${item.name}.`;
    case "percentStat":
      if (item.effect.stat === "speed") {
        const bonus = Math.max(1, Math.floor(champion.speed * (item.effect.percent / 100)));
        champion.speed += bonus;
        // Guarda el bonus per poder revertir-lo correctament a unequipItem
        (champion as Champion & { speedBonusApplied?: number }).speedBonusApplied = bonus;
      }

      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      champion.equippedItemEffect = item.effect;
      return `${champion.name} equips ${item.name}.`;
    case "level":
      for (let index = 0; index < item.effect.amount; index += 1) {
        levelUpChampion(champion);
      }
      return `${champion.name} gains ${item.effect.amount} level.`;
    case "damageTypeChoice":
      if (damageTypeTarget === undefined) {
        return "Falta el tipus de dany de destí.";
      }

      champion.damageType = damageTypeTarget;
      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      champion.equippedItemEffect = item.effect;
      return `${champion.name} changes damage type.`;
    case "passive":
      champion.itemPassive = item.effect.passive;
      resetCopiedPassiveState(champion);
      champion.equippedItemId = item.id;
      champion.equippedItemName = item.name;
      champion.equippedItemEffect = item.effect;
      return `${champion.name} gains the passive ${getPassiveName(item.effect.passive)}.`;
  }
}

export function unequipItem(champion: Champion): InventoryItem | null {
  if (!champion.equippedItemId || !champion.equippedItemName) return null;

  // Reconstrueix l'item amb l'efecte original guardat
  const itemName = champion.equippedItemName;
  const item: InventoryItem = {
    id: champion.equippedItemId,
    name: itemName,
    description: "",
    effect: champion.equippedItemEffect ?? { type: "stat", stat: "attack", amount: 0 }
  };

  // Desfà els efectes segons el nom de l'item
  // Com que no tenim l'efecte original guardat, fem el següent:
  // Els items de stat es poden identificar pel nom i revertir
  const statItems: Record<string, { stat: "attack" | "ap" | "maxHp" | "armor" | "magic_resist" | "speed"; amount: number }> = {
    "Long Sword": { stat: "attack", amount: 10 },
    "Magic Tome": { stat: "ap", amount: 10 },
    "Ruby Crystal": { stat: "maxHp", amount: 5 },
    "Cloth Armor": { stat: "armor", amount: 5 },
    "Null Magic Mantle": { stat: "magic_resist", amount: 5 },
    "Infinity Edge": { stat: "attack", amount: 20 },
    "Luden's Echo": { stat: "ap", amount: 20 },
    "Warmog's Armor": { stat: "maxHp", amount: 15 },
    "Sunfire Cape": { stat: "armor", amount: 15 },
    "Force of Nature": { stat: "armor", amount: 15 },
  };

  const statInfo = statItems[itemName];
  if (statInfo) {
    switch (statInfo.stat) {
      case "attack": champion.attack -= statInfo.amount; break;
      case "ap": champion.ap -= statInfo.amount; break;
      case "maxHp":
        champion.maxHp -= statInfo.amount;
        champion.currentHp = Math.min(champion.currentHp, champion.maxHp);
        break;
      case "armor": champion.armor -= statInfo.amount; break;
      case "magic_resist": champion.magic_resist -= statInfo.amount; break;
      case "speed": champion.speed -= statInfo.amount; break;
    }
  } else if (itemName === "Dagger" || itemName === "Phantom Dancer") {
    // +5% / +10% speed — revertir usant el bonus guardat
    const championExt = champion as Champion & { speedBonusApplied?: number };
    const bonus = championExt.speedBonusApplied ?? Math.max(1, Math.floor(champion.speed * 0.05));
    champion.speed = Math.max(1, champion.speed - bonus);
    delete championExt.speedBonusApplied;
  } else if (itemName === "Damage Shifter") {
    // Revertir el tipus de dany
    const current = champion.damageType;
    champion.damageType =
      current === DamageType.Physical ? DamageType.Magical
      : current === DamageType.Magical ? DamageType.Mixed
      : DamageType.Physical;
  } else if (champion.itemPassive) {
    // Era una passiva — treu-la
    delete champion.itemPassive;
    resetCopiedPassiveState(champion);
  }

  // Neteja l'equipament
  delete champion.equippedItemId;
  delete champion.equippedItemName;
  delete champion.equippedItemEffect;

  return item;
}