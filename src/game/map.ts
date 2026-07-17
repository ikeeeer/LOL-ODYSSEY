

import type { Champion, ChampionBase } from "./types";
import { Region } from "./types";
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
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getRandomChampions(pool: ChampionBase[], count: number): ChampionBase[] {
    return shuffle(pool).slice(0, Math.min(count, pool.length));
}

function getRandomNonScrimNonBardNodeType(): NodeType {
    const options = [
        NodeType.Duel,
        NodeType.Recruit,
        NodeType.Objects
    ];

    return options[Math.floor(Math.random() * options.length)];
}

function getRandomNonHealNonBardNodeType(): NodeType {
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
    const [firstNodeType, secondNodeType, thirdNodeType] = getFirstThreeNodeTypes();

    // Estructura del mapa (17 nodes, 7 nivells de depth 0 a 6):
    // Nivell 0: START (1)
    // Nivell 1: A(2), B(3), C(4)
    // Nivell 2: D(5), E(6), F(7)
    // Nivell 3: G(8), H(9), I(10), J(11)
    // Nivell 4: K(12), L(13), M(14)
    // Nivell 5: N(15), O(16)
    // Nivell 6: BOSS(17)
    //
    // Restriccions:
    // - Només 1 node de Scrim (al nivell 3)
    // - Només 1 node de Bard (en qualsevol node no-Start, no-Boss, no-Scrim)
    // - Un dels 2 últims nodes (15 o 16) ha de ser de curació (Heal)

    // Triar la posició de l'únic Scrim (nivell 3: nodes 8-11)
    const scrimNodeId = [8, 9, 10, 11][Math.floor(Math.random() * 4)];

    // Triar la posició del Bard a partir del nivell 3 (nodes 8-16, excloent Scrim)
    const bardCandidateIds = [8, 9, 10, 11, 12, 13, 14, 15, 16].filter(
        id => id !== scrimNodeId
    );
    const bardNodeId = bardCandidateIds[Math.floor(Math.random() * bardCandidateIds.length)];

    // Triar quin dels 2 últims nodes (15 o 16) serà de curació
    const healNodeId = Math.random() < 0.5 ? 15 : 16;

    // Construeix els tipus de node
    function getNodeType(nodeId: number, depth: number): NodeType {
        if (nodeId === scrimNodeId) return NodeType.Scrim;
        if (nodeId === bardNodeId) return NodeType.Bard;
        if (nodeId === healNodeId) return NodeType.Heal;
        // Nodes del nivell 1 usen firstNodeType etc.
        if (nodeId === 2) return firstNodeType;
        if (nodeId === 3) return secondNodeType;
        if (nodeId === 4) return thirdNodeType;
        // Nodes del nivell 2-4: no Scrim, no Bard
        if (depth <= 4) return getRandomNonScrimNonBardNodeType();
        // Nodes del nivell 5 (no el de curació): no Heal, no Bard
        return getRandomNonHealNonBardNodeType();
    }

    const nodes: MapNode[] = [
        { id: 1, type: NodeType.Start, depth: 0, next: [2, 3, 4] },
        { id: 2, type: getNodeType(2, 1), depth: 1, next: [5] },
        { id: 3, type: getNodeType(3, 1), depth: 1, next: [6] },
        { id: 4, type: getNodeType(4, 1), depth: 1, next: [7] },
        { id: 5, type: getNodeType(5, 2), depth: 2, next: [8, 9] },
        { id: 6, type: getNodeType(6, 2), depth: 2, next: [9, 10] },
        { id: 7, type: getNodeType(7, 2), depth: 2, next: [10, 11] },
        { id: 8, type: getNodeType(8, 3), depth: 3, next: [12] },
        { id: 9, type: getNodeType(9, 3), depth: 3, next: [12, 13] },
        { id: 10, type: getNodeType(10, 3), depth: 3, next: [13, 14] },
        { id: 11, type: getNodeType(11, 3), depth: 3, next: [14] },
        { id: 12, type: getNodeType(12, 4), depth: 4, next: [15] },
        { id: 13, type: getNodeType(13, 4), depth: 4, next: [15, 16] },
        { id: 14, type: getNodeType(14, 4), depth: 4, next: [16] },
        { id: 15, type: getNodeType(15, 5), depth: 5, next: [17] },
        { id: 16, type: getNodeType(16, 5), depth: 5, next: [17] },
        { id: 17, type: NodeType.Boss, depth: 6, next: [] }
    ];

    const bossChampionName = phase === 5 ? "Demacia Protectors" : phase === 4 ? "Galio" : phase === 3 ? "Sylas" : phase === 2 ? "Poppy" : "Quinn";

    return {
        nodes,
        startNodeId: 1,
        bossNodeId: 17,
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