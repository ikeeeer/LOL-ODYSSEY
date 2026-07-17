import type { MapNode, MapGraph } from "../game/map";
import { NodeType } from "../game/map";
import { getNodeSprite } from "../game/nodeSprites";
import { getChampionSprite } from "../game/sprites";
import demaciaLogo from "../assets/backgrounds/Logo demacia.png";

const nodeTypeLabels: Record<NodeType, string> = {
  [NodeType.Start]: "Start",
  [NodeType.Duel]: "Duel",
  [NodeType.Scrim]: "Scrim",
  [NodeType.Recruit]: "Recruit",
  [NodeType.Heal]: "Heal",
  [NodeType.ChooseNewChamp]: "New champion",
  [NodeType.Objects]: "Items",
  [NodeType.Bard]: "Bard",
  [NodeType.Boss]: "Boss",
};

// Mapeja cada tipus de node al nom del fitxer de sprite corresponent.
const nodeTypeSpriteNames: Record<NodeType, string> = {
  [NodeType.Start]: "Start",
  [NodeType.Duel]: "Duel",
  [NodeType.Scrim]: "Scrim",
  [NodeType.Recruit]: "Recruit",
  [NodeType.Heal]: "Heal",
  [NodeType.ChooseNewChamp]: "Recruit",
  [NodeType.Objects]: "Items",
  [NodeType.Bard]: "Bard",
  [NodeType.Boss]: "Boss",
};

const phaseNames: Record<number, string> = {
  1: "The borders",
  2: "The guardian",
  3: "The rebels",
  4: "The protector",
  5: "Demacia elite",
};

function getNodeImage(node: MapNode, map: MapGraph): { src: string; alt: string } | null {
  if (node.type === NodeType.Boss) {
    // A l'última fase el boss és un equip de Demacia: mostra el logo
    if (map.phase === 5) {
      return { src: demaciaLogo, alt: `Boss: ${map.bossChampionName}` };
    }
    const sprite = getChampionSprite(map.bossChampionName);
    if (sprite) return { src: sprite, alt: map.bossChampionName };
  }

  const spriteName = nodeTypeSpriteNames[node.type];
  if (spriteName === "Start") return null;
  const sprite = getNodeSprite(spriteName);
  if (sprite) return { src: sprite, alt: nodeTypeLabels[node.type] };
  return null;
}

// Dimensions del mapa
const COLUMN_WIDTH = 180;
const ROW_HEIGHT = 160;
const NODE_SIZE = 110;

interface MapViewProps {
  map: MapGraph;
  currentNode: MapNode | null;
  nextNodes: MapNode[];
  onChooseNode: (node: MapNode) => void;
  awaitingChoice: boolean;
}

export default function MapView({ map, currentNode, nextNodes, onChooseNode, awaitingChoice }: MapViewProps) {
  // Agrupa els nodes per profunditat (depth) per mostrar-los d'esquerra a dreta.
  const maxDepth = Math.max(...map.nodes.map((n) => n.depth));
  const columns: MapNode[][] = [];
  for (let d = 0; d <= maxDepth; d += 1) {
    columns.push(map.nodes.filter((n) => n.depth === d).sort((a, b) => a.id - b.id));
  }

  const maxRows = Math.max(...columns.map((c) => c.length));

  // Calcula les posicions (x, y) de cada node en el sistema de coordenades.
  const positions: Record<number, { x: number; y: number }> = {};
  columns.forEach((column, depth) => {
    const colHeight = column.length * ROW_HEIGHT;
    const startY = (maxRows * ROW_HEIGHT - colHeight) / 2;
    column.forEach((node, index) => {
      positions[node.id] = {
        x: depth * COLUMN_WIDTH,
        y: startY + index * ROW_HEIGHT,
      };
    });
  });

  const nextNodeIds = new Set(nextNodes.map((n) => n.id));
  const currentNodeId = currentNode?.id ?? -1;

  const mapWidth = maxDepth * COLUMN_WIDTH + NODE_SIZE;
  const mapHeight = maxRows * ROW_HEIGHT;

  // Construeix les línies SVG entre nodes connectats.
  const lines: { x1: number; y1: number; x2: number; y2: number; isPath: boolean }[] = [];
  for (const node of map.nodes) {
    const from = positions[node.id];
    if (!from) continue;
    for (const nextId of node.next) {
      const to = positions[nextId];
      if (!to) continue;
      // Comprova si aquesta connexió és un camí possible des del node actual.
      const isPath = currentNodeId === node.id && nextNodeIds.has(nextId);
      lines.push({
        x1: from.x + NODE_SIZE / 2,
        y1: from.y + NODE_SIZE / 2,
        x2: to.x + NODE_SIZE / 2,
        y2: to.y + NODE_SIZE / 2,
        isPath,
      });
    }
  }

  return (
    <div className="map-view">
      <div className="map-view__header">
        <h2 className="map-view__title">{phaseNames[map.phase] ?? `Phase ${map.phase}`}</h2>
        <span className="map-view__boss">Boss: {map.bossChampionName}</span>
      </div>

      <div className="map-view__scroll">
        <div className="map-view__canvas" style={{ width: mapWidth, height: mapHeight }}>
          {/* Línies de connexió */}
          <svg className="map-view__svg" width={mapWidth} height={mapHeight}>
            {lines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                className={line.isPath ? "map-line map-line--path" : "map-line"}
              />
            ))}
          </svg>

          {/* Nodes */}
          {map.nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const isCurrent = node.id === currentNodeId;
            const isNext = nextNodeIds.has(node.id);
            const isClickable = awaitingChoice && isNext;
            const image = getNodeImage(node, map);

            return (
              <button
                key={node.id}
                className={`map-node ${isCurrent ? "map-node--current" : ""} ${isNext ? "map-node--next" : ""} ${isClickable ? "map-node--clickable" : ""}`}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                }}
                onClick={() => isClickable && onChooseNode(node)}
                disabled={!isClickable}
                title={nodeTypeLabels[node.type]}
              >
                <div className="map-node__sprite">
                  {image ? (
                    <img src={image.src} alt={image.alt} />
                  ) : (
                    <span className="map-node__emoji">🏁</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
