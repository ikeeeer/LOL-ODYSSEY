

import { Champion, ChampionBase, Region } from "./types";
import { DEMACIA_CHAMPIONS, createChampionInstance } from "./champions";

export enum NodeType {
    Start,
    Duel,
    Scrim,
    Recruit,
    Heal,
    ChooseNewChamp,
    Objects,
    Bard,
    Boss
}

export interface MapNode {
    id: number;
    type: NodeType;
    depth: number;
    next: number[];
}

export interface MapGraph {
    nodes: MapNode[];
    startNodeId: number;
    bossNodeId: number;
    phase: number;
    bossChampionName: string;
}

function shuffle<T>(items: T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
}

function getRandomChampions(pool: ChampionBase[], count: number): ChampionBase[] {
    return shuffle(pool).slice(0, Math.min(count, pool.length));
}

function getRandomNonScrimNodeType(): NodeType {
    const options = [
        NodeType.Duel,
        NodeType.Recruit,
        NodeType.Objects
    ];

    return options[Math.floor(Math.random() * options.length)];
}

function getRandomNonHealNodeType(): NodeType {
    const options = [
        NodeType.Duel,
        NodeType.Recruit,
        NodeType.Objects
    ];

    return options[Math.floor(Math.random() * options.length)];
}

function getRandomNodeTypeExcluding(excludedTypes: NodeType[]): NodeType {
    const options = [
        NodeType.Duel,
        NodeType.Recruit,
        NodeType.Objects
    ].filter(type => !excludedTypes.includes(type));

    return options[Math.floor(Math.random() * options.length)];
}

function getFirstThreeNodeTypes(): [NodeType, NodeType, NodeType] {
    const positions = shuffle([0, 1, 2]);
    const nodeTypes: NodeType[] = [
        getRandomNodeTypeExcluding([NodeType.Duel, NodeType.Recruit]),
        getRandomNodeTypeExcluding([NodeType.Duel, NodeType.Recruit]),
        getRandomNodeTypeExcluding([NodeType.Duel, NodeType.Recruit])
    ];

    nodeTypes[positions[0]] = NodeType.Duel;
    nodeTypes[positions[1]] = NodeType.Recruit;

    return [nodeTypes[0], nodeTypes[1], nodeTypes[2]];
}

function buildPhaseMap(phase: number): MapGraph {
    const healSlot = [11, 12, 13][Math.floor(Math.random() * 3)];
    const bardPool = phase === 1
        ? [8, 9, 10, 14, 15]
        : [8, 9, 10, 11, 12, 13, 14, 15].filter(slot => slot !== healSlot);
    const bardSlot = bardPool[Math.floor(Math.random() * bardPool.length)];
    const [firstNodeType, secondNodeType, thirdNodeType] = getFirstThreeNodeTypes();
    const lastThreeNodes = [11, 12, 13].map(nodeId => ({
        id: nodeId,
        type: nodeId === healSlot ? NodeType.Heal : getRandomNonHealNodeType(),
        depth: nodeId === 11 ? 4 : nodeId === 12 ? 5 : 6,
        next: nodeId === 11 ? [14, 15] : nodeId === 12 ? [14, 15] : [16]
    }));

    const nodes: MapNode[] = [
        { id: 1, type: NodeType.Start, depth: 0, next: [2, 3, 4] },
        { id: 2, type: firstNodeType, depth: 1, next: [5, 6] },
        { id: 3, type: secondNodeType, depth: 1, next: [5, 6] },
        { id: 4, type: thirdNodeType, depth: 1, next: [5, 6] },
        { id: 5, type: getRandomNonScrimNodeType(), depth: 2, next: [7, 8] },
        { id: 6, type: getRandomNonScrimNodeType(), depth: 2, next: [7, 8] },
        { id: 7, type: NodeType.Scrim, depth: 3, next: [9, 10] },
        { id: 8, type: bardSlot === 8 ? NodeType.Bard : getRandomNonScrimNodeType(), depth: 3, next: [9, 10] },
        { id: 9, type: bardSlot === 9 ? NodeType.Bard : getRandomNonScrimNodeType(), depth: 4, next: [11, 12] },
        { id: 10, type: bardSlot === 10 ? NodeType.Bard : getRandomNonScrimNodeType(), depth: 4, next: [11, 12] },
        ...lastThreeNodes,
        { id: 14, type: bardSlot === 14 ? NodeType.Bard : getRandomNonHealNodeType(), depth: 7, next: [16] },
        { id: 15, type: bardSlot === 15 ? NodeType.Bard : getRandomNonHealNodeType(), depth: 7, next: [16] },
        { id: 16, type: NodeType.Boss, depth: 8, next: [] }
    ];

    const bossChampionName = phase === 5 ? "Demacia Protectors" : phase === 4 ? "Galio" : phase === 3 ? "Sylas" : phase === 2 ? "Poppy" : "Quinn";

    return {
        nodes,
        startNodeId: 1,
        bossNodeId: 16,
        phase,
        bossChampionName
    };
}

export function buildInitialMap(): MapGraph {
    return buildPhaseMap(1);
}

export function buildSecondPhaseMap(): MapGraph {
    return buildPhaseMap(2);
}

export function buildThirdPhaseMap(): MapGraph {
    return buildPhaseMap(3);
}

export function buildFourthPhaseMap(): MapGraph {
    return buildPhaseMap(4);
}

export function buildFifthPhaseMap(): MapGraph {
    return buildPhaseMap(5);
}

export function getNodeById(map: MapGraph, nodeId: number): MapNode | undefined {
    return map.nodes.find(node => node.id === nodeId);
}

export function getRecruitOptions(depth: number, region: Region = Region.Demacia, phase: number = 1): ChampionBase[] {
    const pool = region === Region.Demacia ? DEMACIA_CHAMPIONS : DEMACIA_CHAMPIONS;
    const options = getRandomChampions(pool, 3);
    const targetLevel = phase === 5 ? Math.max(47, depth) : phase === 4 ? Math.max(35, depth) : phase === 3 ? Math.max(21, depth) : phase === 2 ? Math.max(10, depth) : depth;

    return options.map(champion => ({
        ...champion,
        level: targetLevel
    }));
}

export function getChooseNewChampOptions(depth: number, region: Region = Region.Demacia, phase: number = 1): ChampionBase[] {
    const pool = region === Region.Demacia ? DEMACIA_CHAMPIONS : DEMACIA_CHAMPIONS;
    const options = getRandomChampions(pool, 3);
    const minimumLevel = phase === 5 ? 47 : phase === 4 ? 35 : phase === 3 ? 21 : phase === 2 ? 10 : 1;
    const targetLevel = Math.max(minimumLevel, depth - 2);

    return options.map(champion => ({
        ...champion,
        level: targetLevel
    }));
}

export function getBattleOpponents(node: MapNode, region: Region = Region.Demacia, map?: MapGraph): Champion[] {
    const pool = region === Region.Demacia ? DEMACIA_CHAMPIONS : DEMACIA_CHAMPIONS;
    const enemyLevel = map && map.phase === 5
        ? Math.max(48, node.depth)
        : map && map.phase === 4
            ? Math.max(36, node.depth)
            : map && map.phase === 3
                ? Math.max(23, node.depth)
                : map && map.phase === 2
                    ? Math.max(13, node.depth)
                    : Math.max(1, node.depth);
    const duelCount = map && map.phase === 5
        ? 5
        : map && map.phase === 4
            ? 4
            : map && map.phase === 3
                ? 3
                : map && map.phase === 2
                    ? 2
                    : 1;

    if (node.type === NodeType.Duel) {
        return getRandomChampions(pool, duelCount).map(champion => createChampionInstance({
            ...champion,
            level: enemyLevel
        }));
    }

    if (node.type === NodeType.Scrim) {
        if (node.depth < 3) {
            return [];
        }
        return getRandomChampions(pool, 5).map(champion => createChampionInstance({
            ...champion,
            level: enemyLevel
        }));
    }

    if (node.type === NodeType.Boss) {
        if (map && map.phase === 5) {
            return ["Garen", "Lux", "Sona", "Kayle", "Jarvan IV"].map(bossChampionName => {
                const bossBase = pool.find(champion => champion.name === bossChampionName) || pool[0];
                const bossMaxHp = bossChampionName === "Garen" ? 260 : bossChampionName === "Lux" ? 220 : bossChampionName === "Sona" ? 210 : bossChampionName === "Kayle" ? 230 : 260;
                const boss = createChampionInstance({
                    ...bossBase,
                    level: 55,
                    maxHp: bossMaxHp
                });

                boss.isBoss = true;
                return boss;
            });
        }

        const bossChampionName = map && map.bossChampionName ? map.bossChampionName : "Quinn";
        const bossBase = pool.find(champion => champion.name === bossChampionName) || pool[0];
        const bossLevel = bossChampionName === "Galio" ? 45 : bossChampionName === "Poppy" ? 20 : bossChampionName === "Sylas" ? 33 : 9;
        const bossMaxHp = bossChampionName === "Galio" ? 380 : bossChampionName === "Poppy" ? 260 : bossChampionName === "Sylas" ? 320 : 180;
        const boss = createChampionInstance({
            ...bossBase,
            level: bossLevel,
            maxHp: bossMaxHp
        });

        boss.isBoss = true;
        return [boss];
    }

    return [];
}