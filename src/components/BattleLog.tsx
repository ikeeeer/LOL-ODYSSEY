import { getChampionSprite } from "../game/sprites";

interface BattleLogProps {
  messages: string[];
}

// Llista de noms de campions que poden aparèixer als missatges del registre.
// S'ordenen per longitud descendent perquè "Jarvan IV" es detecti abans que "Jarvan".
const CHAMPION_NAMES = [
  "Jarvan IV",
  "Xin Zhao",
  "Fiora",
  "Galio",
  "Garen",
  "Kayle",
  "Lux",
  "Lucian",
  "Morgana",
  "Poppy",
  "Quinn",
  "Shyvana",
  "Sona",
  "Sylas",
  "Vayne",
  "Locke",
].sort((a, b) => b.length - a.length);

// Divideix un missatge en fragments, alternant text pla i noms de campió.
type MessageSegment = { type: "text"; value: string } | { type: "champion"; name: string };

function splitMessageByChampions(message: string): MessageSegment[] {
  if (CHAMPION_NAMES.length === 0) return [{ type: "text", value: message }];

  const pattern = new RegExp(`(${CHAMPION_NAMES.join("|")})`, "g");
  const parts = message.split(pattern);

  const segments: MessageSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (CHAMPION_NAMES.includes(part)) {
      segments.push({ type: "champion", name: part });
    } else {
      segments.push({ type: "text", value: part });
    }
  }
  return segments;
}

export default function BattleLog({ messages }: BattleLogProps) {
  return (
    <div className="battle-log">
      <h3 className="battle-log__title">Battle log</h3>
      <div className="battle-log__messages">
        {messages.length === 0 ? (
          <p className="battle-log__empty">No messages yet.</p>
        ) : (
          messages.map((message, index) => {
            const segments = splitMessageByChampions(message);
            return (
              <p key={index} className="battle-log__message">
                {segments.map((segment, segIndex) => {
                  if (segment.type === "champion") {
                    const sprite = getChampionSprite(segment.name);
                    return (
                      <span key={segIndex} className="battle-log__champion">
                        {sprite && (
                          <img
                            className="battle-log__champion-sprite"
                            src={sprite}
                            alt={segment.name}
                            title={segment.name}
                          />
                        )}
                        <span className="battle-log__champion-name">{segment.name}</span>
                      </span>
                    );
                  }
                  return <span key={segIndex}>{segment.value}</span>;
                })}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}
