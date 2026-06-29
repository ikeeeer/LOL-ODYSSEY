import { Champion, ChampionBase, Region, Role, GrowthCurve } from "./types";
import { levelUpChampion } from "./leveling";

export const DEMACIA_CHAMPIONS: ChampionBase[] = [
    {
        id: 1,
        name: "Fiora",
        region: Region.Demacia,
        role: Role.Fighter,
        attackGrowth: GrowthCurve.Late,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Early,
        level: 1,
        maxHp: 105,
        attack: 19,
        defense: 8,
        speed: 13
        
    },
    {
        id: 2,
        name: "Galio",
        region: Region.Demacia,
        role: Role.Tank,
        attackGrowth: GrowthCurve.Flat,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 140,
        attack: 14,
        defense: 18,
        speed: 5
    },
    {
        id: 3,
        name: "Garen",
        region: Region.Demacia,
        role: Role.Fighter,
        attackGrowth: GrowthCurve.Mid,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Early,
        speedGrowth: GrowthCurve.Early,
        level: 1,
        maxHp: 130,
        attack: 19,
        defense: 15,
        speed: 7
    },
    {
        id: 4,
        name: "Jarvan IV",
        region: Region.Demacia,
        role: Role.Fighter,
        attackGrowth: GrowthCurve.Early,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 120,
        attack: 20,
        defense: 12,
        speed: 10
    },
    {
        id: 5,
        name: "Kayle",
        region: Region.Demacia,
        role: Role.Marksman,
        attackGrowth: GrowthCurve.Late,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Late,
        level: 1,
        maxHp: 90,
        attack: 16,
        defense: 6,
        speed: 11
    },
    {
        id: 6,
        name: "Lux",
        region: Region.Demacia,
        role: Role.Mage,
        attackGrowth: GrowthCurve.Early,
        hpGrowth: GrowthCurve.Early,
        defenseGrowth: GrowthCurve.Flat,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 90,
        attack: 20,
        defense: 5,
        speed: 10
    },
    {
        id: 7,
        name: "Lucian",
        region: Region.Demacia,
        role: Role.Marksman,
        attackGrowth: GrowthCurve.Early,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Flat,
        speedGrowth: GrowthCurve.Mid,
        level: 1,
        maxHp: 100,
        attack: 21,
        defense: 7,
        speed: 12
    },
    {
        id: 8,
        name: "Morgana",
        region: Region.Demacia,
        role: Role.Mage,
        attackGrowth: GrowthCurve.Early,
        hpGrowth: GrowthCurve.Early,
        defenseGrowth: GrowthCurve.Flat,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 95,
        attack: 19,
        defense: 7,
        speed: 9
    },
    {
        id: 9,
        name: "Poppy",
        region: Region.Demacia,
        role: Role.Tank,
        attackGrowth: GrowthCurve.Flat,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 135,
        attack: 15,
        defense: 17,
        speed: 6
    },
    {
        id: 10,
        name: "Quinn",
        region: Region.Demacia,
        role: Role.Marksman,
        attackGrowth: GrowthCurve.Mid,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Flat,
        speedGrowth: GrowthCurve.Early,
        level: 1,
        maxHp: 95,
        attack: 19,
        defense: 6,
        speed: 15
    },
    {
        id: 11,
        name: "Shyvana",
        region: Region.Demacia,
        role: Role.Fighter,
        attackGrowth: GrowthCurve.Mid,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 125,
        attack: 20,
        defense: 13,
        speed: 8
    },
    {
        id: 12,
        name: "Sona",
        region: Region.Demacia,
        role: Role.Support,
        attackGrowth: GrowthCurve.Early,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 85,
        attack: 12,
        defense: 6,
        speed: 10
    },
    {
        id: 13,
        name: "Sylas",
        region: Region.Demacia,
        role: Role.Mage,
        attackGrowth: GrowthCurve.Mid,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 115,
        attack: 19,
        defense: 10,
        speed: 9
    },
    {
        id: 14,
        name: "Vayne",
        region: Region.Demacia,
        role: Role.Marksman,
        attackGrowth: GrowthCurve.Late,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Flat,
        speedGrowth: GrowthCurve.Mid,
        level: 1,
        maxHp: 90,
        attack: 23,
        defense: 5,
        speed: 14
    },
    {
        id: 15,
        name: "Xin Zhao",
        region: Region.Demacia,
        role: Role.Fighter,
        attackGrowth: GrowthCurve.Mid,
        hpGrowth: GrowthCurve.Mid,
        defenseGrowth: GrowthCurve.Mid,
        speedGrowth: GrowthCurve.Flat,
        level: 1,
        maxHp: 120,
        attack: 21,
        defense: 11,
        speed: 11
    },
    {
        id: 16,
        name: "Locke",
        region: Region.Demacia,
        role: Role.Assassin,
        attackGrowth: GrowthCurve.Mid,
        hpGrowth: GrowthCurve.Flat,
        defenseGrowth: GrowthCurve.Flat,
        speedGrowth: GrowthCurve.Early,
        level: 1,
        maxHp: 105,
        attack: 25,
        defense: 9,
        speed: 10
    }
];

export function createChampionInstance(champion: ChampionBase): Champion {
    const targetLevel = champion.level;
    const instance: Champion = {
        ...champion,
        level: 1,
        currentHp: champion.maxHp
    };

    for (let level = 1; level < targetLevel; level += 1) {
        levelUpChampion(instance);
    }

    instance.currentHp = instance.maxHp;
    return instance;
}
