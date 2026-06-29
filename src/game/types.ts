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
    Flat
}

export interface ChampionBase {
    id: number;
    name: string;

    region: Region;
    role: Role;
    attackGrowth: GrowthCurve;
    hpGrowth: GrowthCurve;
    defenseGrowth: GrowthCurve;
    speedGrowth: GrowthCurve;

    level: number;

    maxHp: number;

    attack: number;
    defense: number;
    speed: number;
}

export interface Champion extends ChampionBase {
    currentHp: number;
}

export type Team = Champion[];