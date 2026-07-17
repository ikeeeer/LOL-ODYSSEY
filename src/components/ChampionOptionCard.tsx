import type { ChampionBase } from "../game/types";
import { DamageType, Role } from "../game/types";
import { getChampionSprite } from "../game/sprites";

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

interface ChampionOptionCardProps {
  champion: ChampionBase;
  onClick?: () => void;
  selected?: boolean;
}

export default function ChampionOptionCard({ champion, onClick, selected }: ChampionOptionCardProps) {
  const sprite = getChampionSprite(champion.name);

  return (
    <button
      className={`champion-option-card ${selected ? "champion-option-card--selected" : ""}`}
      onClick={onClick}
    >
      <div className="champion-option-card__header">
        <span className="champion-option-card__name">{champion.name}</span>
        <span className="champion-option-card__level">Lvl {champion.level}</span>
      </div>
      {sprite && (
        <div className="champion-option-card__sprite-wrap">
          <img
            className="champion-option-card__sprite"
            src={sprite}
            alt={champion.name}
            title={champion.name}
          />
        </div>
      )}
      <div className="champion-option-card__role">
        {roleLabels[champion.role]} · {damageTypeLabels[champion.damageType]}
      </div>
      <div className="champion-option-card__stats">
        <span>AD {champion.attack}</span>
        <span>AP {champion.ap}</span>
        <span>AR {champion.armor}</span>
        <span>MR {champion.magic_resist}</span>
        <span>SP {champion.speed}</span>
      </div>
    </button>
  );
}
