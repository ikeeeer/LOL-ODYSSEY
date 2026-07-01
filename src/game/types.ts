export enum Region {
    Bandle_City,
    Bilgewater,
    Demacia,
    Freljord,
    Ionia,
    Ixtal,
    Noxus,
    Piltover,
    Shadow_Isles,
    Shurima,
    Targon,
    The_Void,
    Zaun
}

export enum Role {
    Tank,
    Fighter,
    Assassin,
    Mage,
    Marksman,
    Support
}

export enum GrowthCurve {
    Early,
    Mid,
    Late,
    Flat,
    None
}
export enum DamageType {
    Physical,
    Magical,
    Mixed
}

export type ItemPassiveType =
    | "Fiora"
    | "Jarvan IV"
    | "Lux"
    | "Vayne"
    | "Quinn"
    | "Locke"
    | "Sylas"
    | "Xin Zhao"
    | "Lucian"
    | "Morgana"
    | "Galio"
    | "Garen"
    | "Poppy"
    | "Shyvana";

export type ItemEffect =
    | { type: "stat"; stat: "attack" | "ap" | "maxHp" | "armor" | "magic_resist" | "speed"; amount: number }
    | { type: "percentStat"; stat: "speed"; percent: number }
    | { type: "level"; amount: number }
    | { type: "damageTypeChoice" }
    | { type: "passive"; passive: ItemPassiveType };

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    effect: ItemEffect;
}


export interface ChampionBase {
    id: number;
    name: string;

    region: Region;
    role: Role;
    apGrowth: GrowthCurve;
    attackGrowth: GrowthCurve;
    hpGrowth: GrowthCurve;
    defenseGrowth: GrowthCurve;
    speedGrowth: GrowthCurve;

    level: number;

    maxHp: number;

    ap: number; //ability power
    attack: number;
    armor: number;
    magic_resist: number;
    speed: number;
    damageType: DamageType;
}

export interface Champion extends ChampionBase {
    currentHp: number;
    equippedItemId?: string;
    equippedItemName?: string;
    itemPassive?: ItemPassiveType;
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
}

export type Team = Champion[];