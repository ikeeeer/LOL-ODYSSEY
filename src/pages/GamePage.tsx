import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Run } from "../game/run";
import { Region, DamageType } from "../game/types";
import type { Champion, ChampionBase, InventoryItem } from "../game/types";
import { createChampionInstance, DEMACIA_CHAMPIONS } from "../game/champions";
import {
  buildInitialMap,
  buildSecondPhaseMap,
  buildThirdPhaseMap,
  buildFourthPhaseMap,
  buildFifthPhaseMap,
  getNodeById,
  getBattleOpponents,
  getRecruitOptions,
  NodeType,
} from "../game/map";
import type { MapGraph, MapNode } from "../game/map";
import { simulateBattleStepByStep } from "../game/battleSteps";
import type { BattleEvent } from "../game/battleSteps";
import { getBardNodeOptions, resolveBardOption } from "../game/bard";
import type { BardOption } from "../game/bard";
import { fullHealAndRevive, levelUpTeam } from "../game/leveling";
import {
  applyItemToChampion,
  canEquipItem,
  formatItemEffect,
  getObjectNodeOptions,
  unequipItem,
} from "../game/items";
import TeamPanel from "../components/TeamPanel";
import MapView from "../components/MapView";
import ChampionOptionCard from "../components/ChampionOptionCard";
import ChampionCard from "../components/ChampionCard";
import BattleView from "../components/BattleView";
import ItemOptionCard from "../components/ItemOptionCard";
import BardOptionCard from "../components/BardOptionCard";
import { getItemSprite } from "../game/itemSprites";
import { getChampionSprite } from "../game/sprites";
import demaciaPhase1Bg from "../assets/backgrounds/Demacia - Fase 1.jfif";
import demaciaPhase2Bg from "../assets/backgrounds/Demacia - Fase 2.jfif";
import demaciaPhase3Bg from "../assets/backgrounds/Demacia - Fase 3.jfif";
import demaciaPhase4Bg from "../assets/backgrounds/Demacia - Fase 4.jfif";
import demaciaPhaseFinalBg from "../assets/backgrounds/Demacia - Fase final.jfif";
import menuImage from "../assets/UI/Menu image.png";
import startButtonBg from "../assets/UI/Start button.png";
import settingsPageBg from "../assets/UI/Settings page.png";
import settingsIcon from "../assets/UI/Settings icon.png";
import bgMusic from "../assets/music/Medieval background music.mp3";
import audioManager from "../audio/AudioManager";
import "../App.css";

const phaseBackgrounds: Record<number, string> = {
  1: demaciaPhase1Bg,
  2: demaciaPhase2Bg,
  3: demaciaPhase3Bg,
  4: demaciaPhase4Bg,
  5: demaciaPhaseFinalBg,
};

type Screen =
  | "idle"
  | "recruit"
  | "replace-champ"
  | "battle"
  | "objects"
  | "equip-item"
  | "equip-bag-item"
  | "bard"
  | "battle-result"
  | "heal"
  | "game-over"
  | "victory"
  | "settings";

function BagItemIcon({ item }: { item: InventoryItem }) {
  let sprite: string | undefined;
  if (item.effect.type === "passive") {
    sprite = getChampionSprite(item.effect.passive);
  } else {
    sprite = getItemSprite(item.name);
  }

  if (!sprite) return <span className="bag-item__fallback">{item.name.slice(0, 2)}</span>;
  return <img className="bag-item__icon" src={sprite} alt={item.name} title={item.name} />;
}

// ADMIN MODE: per testing ràpid, descomenta per fer servir
// function buildAdminTeam(region: Region = Region.Demacia): Champion[] {
//   const names = ["Galio", "Fiora", "Kayle", "Poppy", "Sona"];
//   return names
//     .map((name) => DEMACIA_CHAMPIONS.find((c) => c.region === region && c.name === name))
//     .filter((c): c is ChampionBase => Boolean(c))
//     .map((c) => createChampionInstance({ ...c, level: 50 }));
// }

export default function GamePage() {
  const runRef = useRef<Run | null>(null);
  const mapRef = useRef<MapGraph | null>(null);
  const [, setTick] = useState(0);
  const [screen, setScreen] = useState<Screen>("idle");
  const [, setLog] = useState<string[]>([]);
  const [options, setOptions] = useState<ChampionBase[]>([]);
  const [itemOptions, setItemOptions] = useState<InventoryItem[]>([]);
  const [bardOptions, setBardOptions] = useState<BardOption[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<Champion[]>([]);
  const [bardMessage, setBardMessage] = useState<string>("");
  const [pendingBardOption, setPendingBardOption] = useState<BardOption | null>(null);
  const [pendingChampion, setPendingChampion] = useState<ChampionBase | null>(null);
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [battleIsDuel, setBattleIsDuel] = useState(false);
  const [battleAliveAtStartIds, setBattleAliveAtStartIds] = useState<number[]>([]);
  const [battleDamageDealt, setBattleDamageDealt] = useState<Record<number, number>>({});
  const [battleTeamA, setBattleTeamA] = useState<Champion[]>([]);
  const [battleTeamB, setBattleTeamB] = useState<Champion[]>([]);
  const [pendingItem, setPendingItem] = useState<InventoryItem | null>(null);
  const [bagItem, setBagItem] = useState<InventoryItem | null>(null);
  const [musicVolume, setMusicVolume] = useState(audioManager.getVolume());

  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  // Inicia la música de fons en bucle
  useEffect(() => {
    audioManager.play(bgMusic);
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    setMusicVolume(volume);
    audioManager.setVolume(volume);
  }, []);

  const currentNode = runRef.current?.currentNode ?? null;

  const nextNodes = useMemo<MapNode[]>(() => {
    const map = mapRef.current;
    const node = runRef.current?.currentNode ?? null;
    if (!map || !node) return [];
    return node.next
      .map((id) => getNodeById(map, id))
      .filter((n): n is MapNode => Boolean(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode, mapRef.current]);

  const pushLog = useCallback((messages: string | string[]) => {
    const lines = Array.isArray(messages) ? messages : [messages];
    setLog((prev) => [...prev, ...lines]);
  }, []);

  const startGame = useCallback(() => {
    const newRun = new Run([], [], Region.Demacia);
    // Mode normal: comença amb un campió aleatori de nivell 1
    const pool = DEMACIA_CHAMPIONS.filter((c) => c.region === Region.Demacia);
    const randomBase = pool[Math.floor(Math.random() * pool.length)];
    const starter = createChampionInstance({ ...randomBase, level: 1 });
    newRun.addChampionToPlayer(starter);

    const newMap = buildInitialMap();
    const startNode = getNodeById(newMap, newMap.startNodeId)!;
    newRun.setCurrentNode(startNode);

    runRef.current = newRun;
    mapRef.current = newMap;
    setLog([`Starting champion: ${starter.name}`]);
    setScreen("idle");
    forceUpdate();
  }, [forceUpdate]);

  // ADMIN MODE: per testing ràpid, descomenta per començar amb un equip de nivell 50
  // const startGameAdmin = useCallback(() => {
  //   const newRun = new Run([], [], Region.Demacia);
  //   const adminTeam = buildAdminTeam(newRun.region);
  //   adminTeam.forEach((c) => newRun.addChampionToPlayer(c));
  //   const newMap = buildInitialMap();
  //   const startNode = getNodeById(newMap, newMap.startNodeId)!;
  //   newRun.setCurrentNode(startNode);
  //   runRef.current = newRun;
  //   mapRef.current = newMap;
  //   setLog(["ADMIN MODE: starting team at level 50.", `Team: ${adminTeam.map((c) => c.name).join(", ")}`]);
  //   setScreen("idle");
  //   forceUpdate();
  // }, [forceUpdate]);

  const resolveCurrentNode = useCallback(
    async (activeRun: Run, activeMap: MapGraph) => {
      const node = activeRun.currentNode;
      if (!node) return;

      switch (node.type) {
        case NodeType.Start:
          pushLog(`Starting node visited (#${node.id}).`);
          setScreen("idle");
          break;

        case NodeType.Recruit: {
          const opts = getRecruitOptions(node.depth, activeRun.region, activeMap.phase);
          setOptions(opts);
          setScreen("recruit");
          break;
        }

        case NodeType.Objects: {
          const opts = getObjectNodeOptions();
          setItemOptions(opts);
          setScreen("objects");
          break;
        }

        case NodeType.Bard: {
          const opts = getBardNodeOptions();
          setBardOptions(opts);
          setBardMessage("");
          setScreen("bard");
          break;
        }

        case NodeType.Heal: {
          fullHealAndRevive(activeRun.playerTeam);
          forceUpdate();
          setScreen("idle");
          break;
        }

        case NodeType.Duel:
        case NodeType.Scrim:
        case NodeType.Boss: {
          const opponents = getBattleOpponents(node, activeRun.region, activeMap);
          if (opponents.length === 0) {
            pushLog("No combat at this node.");
            setScreen("idle");
            break;
          }
          if (activeRun.playerTeam.length === 0 || !activeRun.playerTeam.some((c) => c.currentHp > 0)) {
            pushLog("Your team cannot fight.");
            setScreen("game-over");
            break;
          }
          setEnemyTeam(opponents);
          // Captura els IDs dels campions vius ABANS de la simulació
          const aliveAtStartIds = activeRun.playerTeam.filter((c) => c.currentHp > 0).map((c) => c.id);
          // Clona els campions perquè la simulació no modifiqui els originals
          const playerClones = activeRun.playerTeam.map((c) => ({ ...c }));
          const opponentClones = opponents.map((c) => ({ ...c }));
          // Simula la batalla pas a pas i guarda els events
          const result = simulateBattleStepByStep(
            playerClones,
            opponentClones,
            node.type === NodeType.Duel
          );
          setBattleTeamA(playerClones);
          setBattleTeamB(opponentClones);
          setBattleEvents(result.events);
          setBattleIsDuel(result.isDuel);
          setBattleAliveAtStartIds(aliveAtStartIds);
          setBattleDamageDealt(result.damageDealt);
          setScreen("battle");
          break;
        }

        default:
          break;
      }
    },
    [pushLog, forceUpdate]
  );

  const handleChooseNode = useCallback(
    (node: MapNode) => {
      const run = runRef.current;
      const map = mapRef.current;
      if (!run || !map) return;
      run.setCurrentNode(node);
      pushLog(`Advancing to node #${node.id}.`);
      forceUpdate();
      void resolveCurrentNode(run, map);
    },
    [pushLog, forceUpdate, resolveCurrentNode]
  );

  const handleRecruit = useCallback(
    (index: number | null) => {
      const run = runRef.current;
      if (!run) return;
      if (index === null) {
        pushLog("You decided not to recruit any champion.");
        forceUpdate();
        setScreen("idle");
      } else {
        const chosen = options[index];
        if (run.playerTeam.length < 5) {
          const champion = createChampionInstance(chosen);
          run.playerTeam.push(champion);
          pushLog(`Recruited: ${champion.name}.`);
          forceUpdate();
          setScreen("idle");
        } else {
          setPendingChampion(chosen);
          setScreen("replace-champ");
        }
      }
    },
    [options, pushLog, forceUpdate]
  );

  const handleReplaceChampion = useCallback(
    (teamIndex: number) => {
      const run = runRef.current;
      if (!run || !pendingChampion) return;
      const replaced = run.playerTeam[teamIndex];
      const champion = createChampionInstance(pendingChampion);
      run.playerTeam[teamIndex] = champion;
        pushLog(`Replaced ${replaced.name} with ${champion.name}.`);
      setPendingChampion(null);
      forceUpdate();
      setScreen("idle");
    },
    [pendingChampion, pushLog, forceUpdate]
  );

  const handleCancelReplace = useCallback(() => {
    setPendingChampion(null);
    setScreen("idle");
  }, []);

  const handleBattleFinished = useCallback(() => {
    const run = runRef.current;
    const map = mapRef.current;
    if (!run || !map) return;

    // Sincronitza tots els stats dels campions originals amb les còpies de combat
    battleTeamA.forEach((clone, i) => {
      const original = run.playerTeam[i];
      if (original) {
        original.currentHp = clone.currentHp;
        original.maxHp = clone.maxHp;
        original.attack = clone.attack;
        original.ap = clone.ap;
        original.armor = clone.armor;
        original.magic_resist = clone.magic_resist;
        original.speed = clone.speed;
      }
    });

    const won = run.playerTeam.some((c) => c.currentHp > 0);
    setEnemyTeam([...battleTeamB]);

    // Aplica els level ups un cop acabat el combat (després de mostrar les vides finals)
    if (won) {
      const aliveAtStart = run.playerTeam.filter((c) => battleAliveAtStartIds.includes(c.id));
      if (battleIsDuel) {
        levelUpTeam(run.playerTeam, aliveAtStart);
      } else {
        levelUpTeam(run.playerTeam, aliveAtStart);
        levelUpTeam(run.playerTeam, aliveAtStart);
        levelUpTeam(run.playerTeam, aliveAtStart);
      }
    }

    forceUpdate();

    if (!won) {
      setScreen("game-over");
    } else {
      // Continua directament sense pantalla de resultat
      const node = run.currentNode;
      if (node?.type === NodeType.Boss) {
        let nextMap: MapGraph | null = null;
        if (map.phase === 1) nextMap = buildSecondPhaseMap();
        else if (map.phase === 2) nextMap = buildThirdPhaseMap();
        else if (map.phase === 3) nextMap = buildFourthPhaseMap();
        else if (map.phase === 4) nextMap = buildFifthPhaseMap();
        else if (map.phase === 5) {
          setScreen("victory");
          return;
        }
        if (nextMap) {
          fullHealAndRevive(run.playerTeam);
          const startNode = getNodeById(nextMap, nextMap.startNodeId)!;
          run.setCurrentNode(startNode);
          mapRef.current = nextMap;
          forceUpdate();
          setScreen("idle");
          return;
        }
      }
      setScreen("idle");
    }
  }, [battleTeamA, battleTeamB, battleIsDuel, battleAliveAtStartIds, forceUpdate]);

  const handleChooseItem = useCallback(
    (index: number) => {
      const item = itemOptions[index];
      setPendingItem(item);
      setScreen("equip-item");
    },
    [itemOptions]
  );

  const handleStoreItemInBag = useCallback(() => {
    const run = runRef.current;
    if (!run || !pendingItem) return;
    run.addItemToBag(pendingItem);
    pushLog(`Has guardat ${pendingItem.name} a la bossa.`);
    setPendingItem(null);
    forceUpdate();
    setScreen("idle");
  }, [pendingItem, pushLog, forceUpdate]);

  const handleEquipItemToChampion = useCallback(
    (teamIndex: number) => {
      const run = runRef.current;
      if (!run || !pendingItem) return;
      const target = run.playerTeam[teamIndex];

      if (!canEquipItem(target, pendingItem)) {
        pushLog(`${target.name} already has an item equipped.`);
        return;
      }

      let damageTarget: DamageType | undefined;
      if (pendingItem.effect.type === "damageTypeChoice") {
        const current = target.damageType;
        damageTarget =
          current === DamageType.Physical
            ? DamageType.Magical
            : current === DamageType.Magical
              ? DamageType.Mixed
              : DamageType.Physical;
      }

      const message = applyItemToChampion(target, pendingItem, damageTarget);
      pushLog(message);
      setPendingItem(null);
      forceUpdate();
      setScreen("idle");
    },
    [pendingItem, pushLog, forceUpdate]
  );

  const handleCancelEquipItem = useCallback(() => {
    setPendingItem(null);
    setScreen("idle");
  }, []);

  const handleSelectBagItem = useCallback(
    (index: number) => {
      const run = runRef.current;
      if (!run) return;
      const item = run.bag[index];
      if (!item) return;
      setBagItem(item);
      setScreen("equip-bag-item");
    },
    []
  );

  const handleEquipBagItemToChampion = useCallback(
    (teamIndex: number) => {
      const run = runRef.current;
      if (!run || !bagItem) return;
      const target = run.playerTeam[teamIndex];

      // Si el campió ja té un item equipat, el desequipa i el torna a la bossa
      if (target.equippedItemId) {
        const removed = unequipItem(target);
        if (removed) {
          run.bag.push(removed);
        }
      }

      let damageTarget: DamageType | undefined;
      if (bagItem.effect.type === "damageTypeChoice") {
        const current = target.damageType;
        damageTarget =
          current === DamageType.Physical
            ? DamageType.Magical
            : current === DamageType.Magical
              ? DamageType.Mixed
              : DamageType.Physical;
      }

      const message = applyItemToChampion(target, bagItem, damageTarget);
      pushLog(message);

      // Treu l'item de la bossa
      const bagIndex = run.bag.findIndex((i) => i === bagItem);
      if (bagIndex >= 0) run.bag.splice(bagIndex, 1);

      setBagItem(null);
      forceUpdate();
      setScreen("idle");
    },
    [bagItem, pushLog, forceUpdate]
  );

  const handleUnequipChampion = useCallback(
    (teamIndex: number) => {
      const run = runRef.current;
      if (!run) return;
      const target = run.playerTeam[teamIndex];
      if (!target.equippedItemId) return;

      const removed = unequipItem(target);
      if (removed) {
        run.bag.push(removed);
        pushLog(`${target.name} unequipped ${removed.name}.`);
      }
      forceUpdate();
    },
    [pushLog, forceUpdate]
  );

  const handleCancelBagItem = useCallback(() => {
    setBagItem(null);
    setScreen("idle");
  }, []);

  const handleBardOption = useCallback(
    async (index: number) => {
      const run = runRef.current;
      const map = mapRef.current;
      if (!run || !map) return;
      const option = bardOptions[index];
      setPendingBardOption(option);

      const resolution = await resolveBardOption(option, run, run.currentNode?.depth ?? 1);
      setBardMessage(resolution.message);
      pushLog(resolution.message);

      if (resolution.battle) {
        setEnemyTeam(resolution.battle.opponents);
        // Captura els IDs dels campions vius ABANS de la simulació
        const aliveAtStartIds = run.playerTeam.filter((c) => c.currentHp > 0).map((c) => c.id);
        // Clona els campions perquè la simulació no modifiqui els originals
        const playerClones = run.playerTeam.map((c) => ({ ...c }));
        const opponentClones = resolution.battle.opponents.map((c) => ({ ...c }));
        const result = simulateBattleStepByStep(
          playerClones,
          opponentClones,
          resolution.battle.isDuel
        );
        setBattleTeamA(playerClones);
        setBattleTeamB(opponentClones);
        setBattleEvents(result.events);
        setBattleIsDuel(result.isDuel);
        setBattleAliveAtStartIds(aliveAtStartIds);
        setBattleDamageDealt(result.damageDealt);
        setScreen("battle");
      } else {
        forceUpdate();
        setScreen("idle");
      }
      setPendingBardOption(null);
    },
    [bardOptions, pushLog, forceUpdate]
  );

  if (!runRef.current || !mapRef.current) {
    return (
      <div className="game-page game-page--start">
        <div
          className="game-page__background"
          aria-hidden="true"
          style={{ backgroundImage: `url(${menuImage})` }}
        />
        <div className="game-page__content game-page--start-content">
          <button
            className="game-page__menu-btn game-page__menu-btn--start"
            onClick={startGame}
            style={{ backgroundImage: `url(${startButtonBg})` }}
          >
            <span className="game-page__menu-btn-text">START ODYSSEY</span>
          </button>
          <button
            className="game-page__menu-btn game-page__menu-btn--settings"
            onClick={() => setScreen("settings")}
            style={{ backgroundImage: `url(${startButtonBg})` }}
          >
            <span className="game-page__menu-btn-text">SETTINGS</span>
          </button>
        </div>
        {screen === "settings" && (
          <div className="game-page__overlay">
            <div
              className="game-page__settings-image-panel"
              style={{ backgroundImage: `url(${settingsPageBg})` }}
            >
              <div className="game-page__settings-panel">
                <h2 className="game-page__settings-title">SETTINGS</h2>
                <div className="game-page__settings-option">
                  <span className="game-page__settings-label">Music volume: {Math.round(musicVolume * 100)}%</span>
                  <input
                    className="game-page__volume-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={musicVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  />
                </div>
                <button
                  className="game-page__menu-btn game-page__menu-btn--back"
                  onClick={() => setScreen("idle")}
                  style={{ backgroundImage: `url(${startButtonBg})` }}
                >
                  <span className="game-page__menu-btn-text">BACK</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const run = runRef.current;
  const map = mapRef.current;
  const awaitingChoice = screen === "idle" && nextNodes.length > 0;

  return (
    <div className={`game-page game-page--phase-${map.phase}`}>
      <div
        className="game-page__background"
        aria-hidden="true"
        style={{ backgroundImage: `url(${phaseBackgrounds[map.phase] ?? demaciaPhase1Bg})` }}
      />
      <div className="game-page__content">
      <header className="game-page__header">
        <div className="game-page__info">
          <button
            className="game-page__settings-icon"
            onClick={() => setScreen("settings")}
            title="Settings"
          >
            <img src={settingsIcon} alt="Settings" />
          </button>
        </div>
        <div
          className="game-page__bag"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-item-source")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={(e) => {
            if (!e.dataTransfer.types.includes("application/x-item-source")) return;
            e.preventDefault();
            const run = runRef.current;
            if (!run) return;
            const sourceId = Number(e.dataTransfer.getData("text/plain"));
            const sourceChamp = run.playerTeam.find((c) => c.id === sourceId);
            if (!sourceChamp || !sourceChamp.equippedItemId) return;
            const removed = unequipItem(sourceChamp);
            if (removed) {
              run.bag.push(removed);
              pushLog(`${sourceChamp.name} unequipped ${removed.name}.`);
            }
            forceUpdate();
          }}
        >
          <span className="game-page__bag-title">BAG</span>
          <div className="game-page__bag-items">
            {run.bag.length === 0 ? (
              <span className="game-page__bag-empty">Empty</span>
            ) : (
              run.bag.map((item, i) => (
                <button
                  key={i}
                  className="bag-item"
                  onClick={() => screen === "idle" && handleSelectBagItem(i)}
                  disabled={screen !== "idle"}
                  title={item.name}
                >
                  <BagItemIcon item={item} />
                </button>
              ))
            )}
          </div>
        </div>
      </header>

      <section className="game-page__team-top">
        <TeamPanel
          title="TEAM"
          team={run.playerTeam}
          highlightDead
          layout="horizontal"
          draggable={screen === "idle" || screen === "battle-result"}
          onReorder={(from, to) => {
            const team = [...run.playerTeam];
            const [moved] = team.splice(from, 1);
            team.splice(to, 0, moved);
            run.playerTeam.length = 0;
            run.playerTeam.push(...team);
            setTick((t) => t + 1);
          }}
          itemDraggable={screen === "idle"}
          onItemDrop={(targetIndex, sourceChampionId) => {
            const run = runRef.current;
            if (!run) return;
            const sourceChamp = run.playerTeam.find((c) => c.id === sourceChampionId);
            const targetChamp = run.playerTeam[targetIndex];
            if (!sourceChamp || !targetChamp || sourceChamp.id === targetChamp.id) return;
            if (!sourceChamp.equippedItemId) return;

            // Desequipa l'item de la font
            const sourceItem = unequipItem(sourceChamp);
            if (!sourceItem) return;

            // Si el destí té un item, el desequipa i l'equipa a la font
            if (targetChamp.equippedItemId) {
              const targetItem = unequipItem(targetChamp);
              if (targetItem) {
                const msg = applyItemToChampion(sourceChamp, targetItem);
                pushLog(msg);
              }
            }

            // Equipa l'item de la font al destí
            const msg = applyItemToChampion(targetChamp, sourceItem);
            pushLog(msg);
            forceUpdate();
          }}
        />
      </section>

      <main className="game-page__main">
        <section className="game-page__teams">
          {enemyTeam.length > 0 && screen === "battle-result" && (
            <TeamPanel title="Enemy team" team={enemyTeam} highlightDead />
          )}
        </section>

        <section className="game-page__side">
          {screen === "game-over" && (
            <div className="game-page__overlay">
              <div className="game-page__overlay-panel game-page__game-over-panel">
                <h3 className="game-page__game-over-title">GAME OVER</h3>
                <div className="game-page__game-over-team">
                  {battleTeamA.map((c) => (
                    <div key={c.id} className="game-page__game-over-champ">
                      <ChampionCard champion={c} isDead={c.currentHp <= 0} />
                      <span className="game-page__game-over-damage">
                        Damage dealt: {battleDamageDealt[c.id] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="game-page__reset-btn" onClick={startGame}>
                  Reset run
                </button>
              </div>
            </div>
          )}

          {screen === "victory" && (
            <div className="game-page__result game-page__result--win">
              <h3>🏆 You completed all phases!</h3>
              <button className="game-page__start-btn" onClick={startGame}>
                New game
              </button>
            </div>
          )}
        </section>
      </main>

      <section className="game-page__map-area">
        <MapView
          map={map}
          currentNode={currentNode}
          nextNodes={nextNodes}
          onChooseNode={handleChooseNode}
          awaitingChoice={awaitingChoice}
        />
      </section>

      {/* Overlays: es mostren sobre el mapa sense amagar la resta */}
      {screen === "recruit" && (
        <div className="game-page__overlay">
          <div className="game-page__overlay-panel">
            <h3>Recruit a champion</h3>
            <div className="game-page__options-grid">
              {options.map((c, i) => (
                <ChampionOptionCard key={i} champion={c} onClick={() => handleRecruit(i)} />
              ))}
              <button className="option-card option-card--skip" onClick={() => handleRecruit(null)}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "replace-champ" && pendingChampion && (
        <div className="game-page__overlay">
          <div className="game-page__overlay-panel">
            <h3>Your team is full. Choose who to replace with {pendingChampion.name}</h3>
            <div className="game-page__replace-grid">
              {run.playerTeam.map((c, i) => (
                <button
                  key={i}
                  className="replace-champ-button"
                  onClick={() => handleReplaceChampion(i)}
                >
                  <ChampionCard champion={c} />
                </button>
              ))}
            </div>
            <button className="option-card option-card--skip" onClick={handleCancelReplace}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {screen === "objects" && (
        <div className="game-page__overlay">
          <div className="game-page__overlay-panel">
            <h3>Choose an item</h3>
            <div className="game-page__options-grid">
              {itemOptions.map((item, i) => (
                <ItemOptionCard key={i} item={item} onClick={() => handleChooseItem(i)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "bard" && (
        <div className="game-page__overlay">
          <div className="game-page__overlay-panel">
            <h3>Bard</h3>
            {bardMessage && <p className="game-page__bard-message">{bardMessage}</p>}
            <div className="game-page__options-grid">
              {bardOptions.map((opt, i) => (
                <BardOptionCard
                  key={i}
                  option={opt}
                  onClick={() => handleBardOption(i)}
                  disabled={pendingBardOption !== null}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "equip-item" && pendingItem && (
        <div className="game-page__overlay">
          <div className="game-page__overlay-panel">
            <h3>{pendingItem.name} — {formatItemEffect(pendingItem)}</h3>
            <div className="game-page__replace-grid">
              {run.playerTeam.map((c, i) => (
                <button
                  key={i}
                  className="replace-champ-button"
                  onClick={() => handleEquipItemToChampion(i)}
                  disabled={!canEquipItem(c, pendingItem)}
                >
                  <ChampionCard champion={c} />
                </button>
              ))}
            </div>
            <div className="game-page__equip-actions">
              <button className="option-card" onClick={handleStoreItemInBag}>
                Store in bag
              </button>
              <button className="option-card option-card--skip" onClick={handleCancelEquipItem}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "equip-bag-item" && bagItem && (
        <div className="game-page__overlay">
          <div className="game-page__overlay-panel">
            <h3>{bagItem.name} — {formatItemEffect(bagItem)}</h3>
            <p className="game-page__equip-hint">Click a champion to equip the item. If they already have one, it will be swapped.</p>
            <div className="game-page__replace-grid">
              {run.playerTeam.map((c, i) => (
                <div key={i} className="equip-bag-champ">
                  <button
                    className="replace-champ-button"
                    onClick={() => handleEquipBagItemToChampion(i)}
                  >
                    <ChampionCard champion={c} />
                  </button>
                  {c.equippedItemId && (
                    <button
                      className="option-card unequip-btn"
                      onClick={() => handleUnequipChampion(i)}
                    >
                      Unequip
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="option-card option-card--skip" onClick={handleCancelBagItem}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {screen === "battle" && (
        <BattleView
          teamA={battleTeamA}
          teamB={battleTeamB}
          events={battleEvents}
          onFinished={handleBattleFinished}
        />
      )}

      {screen === "settings" && (
        <div className="game-page__overlay">
          <div
            className="game-page__settings-image-panel"
            style={{ backgroundImage: `url(${settingsPageBg})` }}
          >
            <div className="game-page__settings-panel">
              <h2 className="game-page__settings-title">SETTINGS</h2>
              <div className="game-page__settings-option">
                <span className="game-page__settings-label">Music volume: {Math.round(musicVolume * 100)}%</span>
                <input
                  className="game-page__volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={musicVolume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                />
              </div>
              <button
                className="game-page__menu-btn game-page__menu-btn--back"
                onClick={() => setScreen("idle")}
                style={{ backgroundImage: `url(${startButtonBg})` }}
              >
                <span className="game-page__menu-btn-text">BACK</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
