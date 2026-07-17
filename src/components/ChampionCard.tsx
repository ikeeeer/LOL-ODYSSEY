import type { Champion } from "../game/types";
import { DamageType, Role } from "../game/types";
import { getChampionSprite } from "../game/sprites";
import { getPassiveDescription } from "../game/items";

const roleLabels: Record<Role, string> = {
  [Role.Tank]: "Tank",
  [Role.Fighter]: "Fighter",
  [Role.Assassin]: "Assassin",
  [Role.Mage]: "Mage",
  [Role.Marksman]: "Marksman",
  [Role.Support]: "Support",
};

const damageTypeLabels: Record<DamageType, string> = {
  [DamageType.Physical]: "Physical",
  [DamageType.Magical]: "Magical",
  [DamageType.Mixed]: "Mixed",
};

// Descripcions de passives per a tots els campions
const championPassiveDescriptions: Record<string, string> = {
  "Fiora": "Every third attack deals bonus damage.",
  "Galio": "Reduces magic damage taken.",
  "Garen": "Regenerates health after being hit.",
  "Jarvan IV": "Every second attack applies max HP drain.",
  "Kayle": "Gains bonus attack and AP as she levels up.",
  "Lux": "Every fourth attack causes a burst of extra damage.",
  "Lucian": "Every third attack fires a second shot.",
  "Morgana": "The champion heals a portion of damage dealt.",
  "Poppy": "Progressively hardens when taking attacks.",
  "Quinn": "Every second attack reduces enemy armor and MR by 5%.",
  "Shyvana": "After combat gains permanent armor and MR.",
  "Sona": "Every second attack buffs the team: +5% damage for everyone this combat.",
  "Sylas": "Every third attack steals temporary AP and converts it to damage.",
  "Vayne": "Every third attack converts the hit to direct damage based on attack.",
  "Xin Zhao": "Every fourth attack bursts and heals the champion.",
  "Locke": "Every second attack reduces enemy speed.",
};

interface ChampionCardProps {
  champion: Champion;
  isDead?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onItemDrop?: (e: React.DragEvent) => void;
  itemDraggable?: boolean;
}

export default function ChampionCard({ champion, isDead, draggable = false, onDragStart, onDragOver, onDragLeave, onDrop, isDragging, isDragOver, onItemDrop, itemDraggable = false }: ChampionCardProps) {
  const hpPercent = Math.max(0, Math.min(100, (champion.currentHp / champion.maxHp) * 100));
  const sprite = getChampionSprite(champion.name);

  // Construeix la descripció amb la passiva del campió i la de l'item equipat
  const tooltipParts: string[] = [];
  const champPassive = championPassiveDescriptions[champion.name];
  if (champPassive) {
    tooltipParts.push(champPassive);
  }
  if (champion.itemPassive) {
    tooltipParts.push(`Item: ${getPassiveDescription(champion.itemPassive)}`);
  }
  const tooltip = tooltipParts.join("\n");

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(champion.id));
    onDragStart?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Si s'està arrossegant un item, delega a onItemDrop
    if (onItemDrop && e.dataTransfer.types.includes("application/x-item-source")) {
      onItemDrop(e);
      return;
    }
    onDrop?.();
  };

  return (
    <div
      className={`champion-card ${isDead ? "champion-card--dead" : ""} ${isDragging ? "champion-card--dragging" : ""} ${isDragOver ? "champion-card--drag-over" : ""}`}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragOver={draggable ? handleDragOver : undefined}
      onDragLeave={onDragLeave}
      onDrop={draggable ? handleDrop : undefined}
    >
      <div className="champion-card__header">
        <span className="champion-card__name">{champion.name}</span>
        {champion.isBoss && <span className="champion-card__boss">BOSS</span>}
        <span className="champion-card__level">Lvl {champion.level}</span>
      </div>
      {sprite && (
        <div className="champion-card__sprite-wrap">
          <img
            className="champion-card__sprite"
            src={sprite}
            alt={champion.name}
            title={champion.name}
            draggable={false}
          />
        </div>
      )}
      <div className="champion-card__role">
        {roleLabels[champion.role]} · {damageTypeLabels[champion.damageType]}
      </div>
      <div className="champion-card__hp">
        <div className="champion-card__hp-bar" style={{ width: `${hpPercent}%` }} />
        <span className="champion-card__hp-text">
          {Math.max(0, champion.currentHp)}/{champion.maxHp}
        </span>
      </div>
      <div className="champion-card__stats">
        <span>AD {champion.attack}</span>
        <span>AP {champion.ap}</span>
        <span>AR {champion.armor}</span>
        <span>MR {champion.magic_resist}</span>
        <span>SP {champion.speed}</span>
      </div>
      {tooltip && (
        <div className="champion-card__passive-desc">{tooltip}</div>
      )}
      {champion.equippedItemName && (
        <div
          className="champion-card__item"
          draggable={itemDraggable}
          onDragStart={(e) => {
            if (!itemDraggable) return;
            e.stopPropagation();
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("application/x-item-source", "champion");
            e.dataTransfer.setData("text/plain", String(champion.id));
          }}
        >
          🎒 {champion.equippedItemName}
        </div>
      )}
    </div>
  );
}
