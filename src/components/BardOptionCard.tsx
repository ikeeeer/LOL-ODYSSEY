import type { BardOption } from "../game/bard";
import { getBardSprite } from "../game/bardSprites";

interface BardOptionCardProps {
  option: BardOption;
  onClick?: () => void;
  disabled?: boolean;
}

const bardDescriptions: Record<string, string> = {
  "lost-meep": "70%: gain a basic item | 30%: duel",
  "misterious-portal": "50%: heal 50% of the team | 50%: special combat",
  "sacrifice": "The strongest loses 3 levels, gains a legendary item",
  "bards-melody": "Partial team heal",
  "pass-of-time": "The whole team gains permanent stats",
  "old-age": "Reduces max HP but gives rewards",
};

export default function BardOptionCard({ option, onClick, disabled }: BardOptionCardProps) {
  const sprite = getBardSprite(option.key);

  return (
    <button
      className="bard-option-card"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="bard-option-card__header">
        <span className="bard-option-card__name">{option.name}</span>
      </div>
      {sprite && (
        <div className="bard-option-card__sprite-wrap">
          <img
            className="bard-option-card__sprite"
            src={sprite}
            alt={option.name}
            title={option.name}
          />
        </div>
      )}
      <span className="bard-option-card__desc">{bardDescriptions[option.key] ?? ""}</span>
    </button>
  );
}
