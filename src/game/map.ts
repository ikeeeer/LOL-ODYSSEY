

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
        NodeType.ChooseNewChamp,
        NodeType.Objects
    ];

    return options[Math.floor(Math.random() * options.length)];
}

function getRandomNonHealNodeType(): NodeType {
    const options = [
        NodeType.Duel,
        NodeType.Recruit,
        NodeType.ChooseNewChamp,
        NodeType.Objects
    ];

    return options[Math.floor(Math.random() * options.length)];
}

export function buildInitialMap(): MapGraph {
    const healSlot = [11, 12, 13][Math.floor(Math.random() * 3)];
    const lastThreeNodes = [11, 12, 13].map(nodeId => ({
        id: nodeId,
        type: nodeId === healSlot ? NodeType.Heal : getRandomNonHealNodeType(),
        depth: nodeId === 11 ? 4 : nodeId === 12 ? 5 : 6,
        next: nodeId === 11 ? [14, 15] : nodeId === 12 ? [14, 15] : [16]
    }));

    const nodes: MapNode[] = [
        { id: 1, type: NodeType.Start, depth: 0, next: [2, 3, 4] },
        { id: 2, type: getRandomNonScrimNodeType(), depth: 1, next: [5, 6] },
        { id: 3, type: getRandomNonScrimNodeType(), depth: 1, next: [5, 6] },
        { id: 4, type: getRandomNonScrimNodeType(), depth: 1, next: [5, 6] },
        { id: 5, type: getRandomNonScrimNodeType(), depth: 2, next: [7, 8] },
        { id: 6, type: getRandomNonScrimNodeType(), depth: 2, next: [7, 8] },
        { id: 7, type: NodeType.Scrim, depth: 3, next: [9, 10] },
        { id: 8, type: getRandomNonScrimNodeType(), depth: 3, next: [9, 10] },
        { id: 9, type: getRandomNonScrimNodeType(), depth: 4, next: [11, 12] },
        { id: 10, type: getRandomNonScrimNodeType(), depth: 4, next: [11, 12] },
        ...lastThreeNodes,
        { id: 14, type: getRandomNonHealNodeType(), depth: 7, next: [16] },
        { id: 15, type: getRandomNonHealNodeType(), depth: 7, next: [16] },
        { id: 16, type: NodeType.Boss, depth: 8, next: [] }
    ];

    return {
        nodes,
        startNodeId: 1,
        bossNodeId: 16
    };
}

export function getNodeById(map: MapGraph, nodeId: number): MapNode | undefined {
    return map.nodes.find(node => node.id === nodeId);
}

export function getRecruitOptions(depth: number, region: Region = Region.Demacia): ChampionBase[] {
    const pool = region === Region.Demacia ? DEMACIA_CHAMPIONS : DEMACIA_CHAMPIONS;
    return getRandomChampions(pool, 3);
}

export function getChooseNewChampOptions(depth: number, region: Region = Region.Demacia): ChampionBase[] {
    const pool = region === Region.Demacia ? DEMACIA_CHAMPIONS : DEMACIA_CHAMPIONS;
    const options = getRandomChampions(pool, 3);
    return options.map(champion => ({
        ...champion,
        level: Math.max(1, depth - 2)
    }));
}

export function getBattleOpponents(node: MapNode, region: Region = Region.Demacia): Champion[] {
    const pool = region === Region.Demacia ? DEMACIA_CHAMPIONS : DEMACIA_CHAMPIONS;
    const enemyLevel = Math.max(1, node.depth);

    if (node.type === NodeType.Duel) {
        return getRandomChampions(pool, 1).map(champion => createChampionInstance({
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
        return getRandomChampions(pool, 1).map(champion => createChampionInstance({
            ...champion,
            level: enemyLevel + 1
        }));
    }

    return [];
}