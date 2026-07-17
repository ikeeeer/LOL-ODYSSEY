import type { InventoryItem } from "../game/types";
import { formatItemEffect } from "../game/items";
import { getItemSprite } from "../game/itemSprites";
import { getChampionSprite } from "../game/sprites";

interface ItemOptionCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

export default function ItemOptionCard({ item, onClick }: ItemOptionCardProps) {
  // Si l'item és una passiva, usa el sprite del campió; sinó, el sprite de l'item.
  let sprite: string | undefined;
  if (item.effect.type === "passive") {
    sprite = getChampionSprite(item.effect.passive);
  } else {
    sprite = getItemSprite(item.name);
  }

  return (
    <button className="item-option-card" onClick={onClick}>
      <div className="item-option-card__header">
        <span className="item-option-card__name">{item.name}</span>
      </div>
      {sprite && (
        <div className="item-option-card__sprite-wrap">
          <img
            className="item-option-card__sprite"
            src={sprite}
            alt={item.name}
            title={item.name}
          />
        </div>
      )}
      <span className="item-option-card__effect">{formatItemEffect(item)}</span>
    </button>
  );
}
