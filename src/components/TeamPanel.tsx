import { useState } from "react";
import type { Champion } from "../game/types";
import ChampionCard from "./ChampionCard";

interface TeamPanelProps {
  title: string;
  team: Champion[];
  highlightDead?: boolean;
  layout?: "vertical" | "horizontal";
  draggable?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  itemDraggable?: boolean;
  onItemDrop?: (targetIndex: number, sourceChampionId: number) => void;
}

export default function TeamPanel({ title, team, highlightDead, layout = "vertical", draggable = false, onReorder, itemDraggable = false, onItemDrop }: TeamPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <div className={`team-panel team-panel--${layout}`}>
      <h2 className="team-panel__title">{title}</h2>
      <div className="team-panel__cards">
        {team.map((champion, index) => (
          <ChampionCard
            key={`${champion.id}-${index}`}
            champion={champion}
            isDead={highlightDead && champion.currentHp <= 0}
            draggable={draggable}
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={() => setDragOverIndex(index)}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={() => {
              if (onReorder && draggedIndex !== null && draggedIndex !== index) {
                onReorder(draggedIndex, index);
              }
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
            isDragging={draggedIndex === index}
            isDragOver={dragOverIndex === index}
            itemDraggable={itemDraggable}
            onItemDrop={(e) => {
              const sourceId = Number(e.dataTransfer.getData("text/plain"));
              onItemDrop?.(index, sourceId);
            }}
          />
        ))}
      </div>
    </div>
  );
}
