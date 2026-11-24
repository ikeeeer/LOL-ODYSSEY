import settingsPageBg from "../assets/UI/Settings page.png";
import startButtonBg from "../assets/UI/Start button.png";

interface StoryScreenProps {
  onClose: () => void;
}

export default function StoryScreen({ onClose }: StoryScreenProps) {
  return (
    <div className="game-page__overlay">
      <div
        className="game-page__story-frame"
        style={{ backgroundImage: `url(${settingsPageBg})` }}
      >
        <div className="game-page__story-panel">
          <h2 className="game-page__story-title">The Fall of Demacia</h2>
          <div className="game-page__story-body">
            <p>
              For centuries, Demacia has stood as a symbol of justice, order and strength.
              Behind its shining walls, however, lies a kingdom built on secrets, oppression
              and fear.
            </p>
            <p>
              The mages of Demacia have awakened an ancient power beneath the capital: a force
              capable of sealing magic across all of Runeterra. Kingdoms will fall, ancient
              powers will disappear, and no one will be able to stand against Demacia.
            </p>
            <p>
              You have lost everything to their ambition. Now, there is only one choice left:
              march into Demacia and destroy the power that threatens the world.
            </p>
            <p>Your journey will take you through five stages:</p>
            <ul>
              <li>
                <strong>The Borders</strong> — Break through Demacia's outer defenses, guarded
                by Quinn.
              </li>
              <li>
                <strong>The Guardians</strong> — Face the kingdom's most devoted defenders, led
                by Poppy.
              </li>
              <li>
                <strong>The Rebels</strong> — Enter a land torn apart by rebellion and confront
                Sylas.
              </li>
              <li>
                <strong>The Protector</strong> — Overcome Galio, the colossal guardian of
                Demacia.
              </li>
              <li>
                <strong>Demacia Elite</strong> — Face the kingdom's strongest champions: the
                Demacia Protectors.
              </li>
            </ul>
            <p>
              Recruit champions, forge powerful synergies, discover legendary items and make
              every decision count.
            </p>
            <p>Demacia believes it is untouchable.</p>
            <p className="game-page__story-final">Prove them wrong.</p>
          </div>
          <button
            className="game-page__story-close"
            onClick={onClose}
            style={{ backgroundImage: `url(${startButtonBg})` }}
          >
            <span className="game-page__story-close-text">CONTINUE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
