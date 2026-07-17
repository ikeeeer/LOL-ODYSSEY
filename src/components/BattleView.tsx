import { useEffect, useRef, useState } from "react";
import type { Champion } from "../game/types";
import { DamageType, Role } from "../game/types";
import { getChampionSprite } from "../game/sprites";
import type { BattleEvent } from "../game/battleSteps";

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

interface BattleChampionProps {
  champion: Champion;
  currentHp: number;
  isAttacking: boolean;
  isHit: boolean;
  isDead: boolean;
}

function BattleChampion({ champion, currentHp, isAttacking, isHit, isDead }: BattleChampionProps) {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / champion.maxHp) * 100));
  const sprite = getChampionSprite(champion.name);

  return (
    <div
      className={`battle-champ ${isAttacking ? "battle-champ--attacking" : ""} ${isHit ? "battle-champ--hit" : ""} ${isDead ? "battle-champ--dead" : ""}`}
    >
      {sprite && (
        <div className="battle-champ__sprite-wrap">
          <img className="battle-champ__sprite" src={sprite} alt={champion.name} />
        </div>
      )}
      <div className="battle-champ__name">{champion.name}</div>
      <div className="battle-champ__role">
        {roleLabels[champion.role]} · {damageTypeLabels[champion.damageType]}
      </div>
      <div className="battle-champ__hp">
        <div className="battle-champ__hp-bar" style={{ width: `${hpPercent}%` }} />
        <span className="battle-champ__hp-text">
          {Math.max(0, currentHp)}/{champion.maxHp}
        </span>
      </div>
      <div className="battle-champ__stats">
        <span>AD {champion.attack}</span>
        <span>AP {champion.ap}</span>
        <span>AR {champion.armor}</span>
        <span>SP {champion.speed}</span>
      </div>
    </div>
  );
}

interface BattleViewProps {
  teamA: Champion[];
  teamB: Champion[];
  events: BattleEvent[];
  onFinished: () => void;
}

export default function BattleView({ teamA, teamB, events, onFinished }: BattleViewProps) {
  const [eventIndex, setEventIndex] = useState(0);
  const [hpMap, setHpMap] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    [...teamA, ...teamB].forEach((c) => {
      map[c.id] = c.currentHp;
    });
    return map;
  });
  const [attackerId, setAttackerId] = useState<number | undefined>(undefined);
  const [defenderId, setDefenderId] = useState<number | undefined>(undefined);
  const [log, setLog] = useState<string[]>([]);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (eventIndex >= events.length) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        const timer = setTimeout(() => onFinished(), 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    const event = events[eventIndex];

    // Actualitza HP
    if (event.hpSnapshot) {
      setHpMap(event.hpSnapshot);
    }

    // Actualitza qui ataca / rep
    if (event.type === "attack") {
      setAttackerId(event.attackerId);
      setDefenderId(event.defenderId);
    } else if (event.type === "death") {
      setAttackerId(undefined);
      setDefenderId(event.defenderId);
    } else if (event.type === "info" || event.type === "end") {
      setAttackerId(undefined);
      setDefenderId(undefined);
    }

    setLog((prev) => [...prev, event.message]);

    // Avança al següent event després d'un delay
    const delay = event.type === "attack" ? 500 : event.type === "death" ? 700 : 350;
    const timer = setTimeout(() => {
      setEventIndex((i) => i + 1);
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIndex, events]);

  const currentEvent = events[eventIndex];
  const isFinished = eventIndex >= events.length;

  return (
    <div className="game-page__overlay">
      <div className="battle-view">
        <div className="battle-view__teams">
          <div className="battle-view__team battle-view__team--a">
            <h3 className="battle-view__team-title">TEAM</h3>
            <div className="battle-view__champs">
              {teamA.map((c) => (
                <BattleChampion
                  key={c.id}
                  champion={c}
                  currentHp={hpMap[c.id] ?? c.currentHp}
                  isAttacking={attackerId === c.id}
                  isHit={defenderId === c.id && currentEvent?.type === "attack"}
                  isDead={(hpMap[c.id] ?? c.currentHp) <= 0}
                />
              ))}
            </div>
          </div>

          <div className="battle-view__vs">VS</div>

          <div className="battle-view__team battle-view__team--b">
            <h3 className="battle-view__team-title battle-view__team-title--placeholder">TEAM</h3>
            <div className="battle-view__champs">
              {teamB.map((c) => (
                <BattleChampion
                  key={c.id}
                  champion={c}
                  currentHp={hpMap[c.id] ?? c.currentHp}
                  isAttacking={attackerId === c.id}
                  isHit={defenderId === c.id && currentEvent?.type === "attack"}
                  isDead={(hpMap[c.id] ?? c.currentHp) <= 0}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="battle-view__log">
          {log.slice(-4).map((msg, i) => (
            <p key={i} className="battle-view__log-line">{msg}</p>
          ))}
        </div>

        {isFinished && (
          <div className="battle-view__result">
            <p>{events[events.length - 1]?.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
