import readline from "readline";
import { simulateBattle } from "./game/battle";
import { createChampionInstance, DEMACIA_CHAMPIONS } from "./game/champions";
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
  MapNode
} from "./game/map";
import { getBardNodeOptions, resolveBardOption, BardOption } from "./game/bard";
import { Run } from "./game/run";
import { Region, ChampionBase, Champion, DamageType } from "./game/types";
import { fullHealAndRevive } from "./game/leveling";
import { applyItemToChampion, canEquipItem, canStoreInBag, formatItemEffect, getObjectNodeOptions } from "./game/items";

const ADMIN_MODE = true;
const ADMIN_TEAM_NAMES = ["Galio", "Fiora", "Kayle", "Poppy", "Sona"];

function getRandomChampionBase(region: Region = Region.Demacia) {
  const options = DEMACIA_CHAMPIONS.filter(champion => champion.region === region);
  return options[Math.floor(Math.random() * options.length)];
}

function getChampionBaseByName(name: string, region: Region = Region.Demacia): ChampionBase | undefined {
  return DEMACIA_CHAMPIONS.find(champion => champion.region === region && champion.name === name);
}

function buildAdminTeam(region: Region = Region.Demacia): Champion[] {
  return ADMIN_TEAM_NAMES
    .map(name => getChampionBaseByName(name, region))
    .filter((champion): champion is ChampionBase => champion !== undefined)
    .map(champion => createChampionInstance({
      ...champion,
      level: 50
    }));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

function printNodeOptions(nodes: MapNode[]): void {
  nodes.forEach((node, index) => {
    console.log(`${index + 1}. [${node.id}] ${NodeType[node.type]}`);
  });
}

function getChampionPreview(champion: ChampionBase): Champion {
  return createChampionInstance(champion);
}

async function chooseNode(nodes: MapNode[]): Promise<MapNode> {
  while (true) {
    printNodeOptions(nodes);
    const answer = await ask("Tria el número del node on vols anar: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= nodes.length) {
      return nodes[choice - 1];
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

function printChampionOptions(options: ChampionBase[]): void {
  options.forEach((champion, index) => {
    const preview = getChampionPreview(champion);
    const damageTypeStr = champion.damageType === DamageType.Physical ? "Physical" : champion.damageType === DamageType.Magical ? "Magical" : "Mixed";
    console.log(`${index + 1}. ${champion.name} (Lvl ${preview.level}) [${damageTypeStr}] - HP ${preview.maxHp}, ATK ${preview.attack}, AP ${preview.ap}, ARM ${preview.armor}, MR ${preview.magic_resist}, SPD ${preview.speed}`);
  });
}

function printItemOptions(options: ReturnType<typeof getObjectNodeOptions>): void {
  options.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name} - ${formatItemEffect(item)}`);
  });
}

async function reorderTeam(team: Champion[]): Promise<void> {
  while (true) {
    console.log("\nOrdre actual del teu equip:");
    team.forEach((champion, index) => {
      console.log(`${index + 1}. ${champion.name} (HP ${champion.currentHp}/${champion.maxHp})`);
    });

    const answer = await ask("\nVols canviar l'ordre del teu equip? (s/n): ");
    if (answer.toLowerCase() !== "s") break;

    const pos1Str = await ask("Posició del primer campió a intercanviar (1-" + team.length + "): ");
    const pos2Str = await ask("Posició del segon campió a intercanviar (1-" + team.length + "): ");

    const pos1 = Number(pos1Str.trim()) - 1;
    const pos2 = Number(pos2Str.trim()) - 1;

    if (pos1 >= 0 && pos1 < team.length && pos2 >= 0 && pos2 < team.length && pos1 !== pos2) {
      [team[pos1], team[pos2]] = [team[pos2], team[pos1]];
      console.log(`\n✓ Intercanviats ${team[pos2].name} i ${team[pos1].name}`);
    } else {
      console.log("Posicions no vàlides.");
    }
  }
}

async function chooseChampion(options: ChampionBase[]): Promise<ChampionBase> {
  while (true) {
    printChampionOptions(options);
    const answer = await ask("Tria un dels 3 champions disponibles: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

async function chooseRecruitChampion(options: ChampionBase[]): Promise<ChampionBase | null> {
  while (true) {
    printChampionOptions(options);
    console.log("4. Skip / no reclutar ningú");

    const answer = await ask("Tria un dels 3 champions disponibles o skip: ");
    const choice = Number(answer.trim());

    if (choice === 4) {
      return null;
    }

    if (!Number.isNaN(choice) && choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }

    if (answer.trim().toLowerCase() === "skip") {
      return null;
    }

    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

function printBardOptions(options: BardOption[]): void {
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option.name}`);
  });
}

async function chooseBardOption(options: BardOption[]): Promise<BardOption> {
  while (true) {
    printBardOptions(options);
    const answer = await ask("Tria una de les 3 opcions de Bard: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

async function chooseItem(options: ReturnType<typeof getObjectNodeOptions>): Promise<(typeof options)[number]> {
  while (true) {
    printItemOptions(options);
    const answer = await ask("Tria un dels 3 objectes disponibles: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= options.length) {
      return options[choice - 1];
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

async function chooseChampionForItem(team: Champion[], itemName: string): Promise<Champion> {
  while (true) {
    console.log(`\nTria el campió per a ${itemName}:`);
    team.forEach((champion, index) => {
      const equippedLabel = champion.equippedItemName ? ` [Objecte: ${champion.equippedItemName}]` : "";
      console.log(`${index + 1}. ${champion.name}${equippedLabel}`);
    });

    const answer = await ask("Campió destinatari: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= team.length) {
      return team[choice - 1];
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

async function chooseChampionToReplace(team: Champion[]): Promise<number> {
  while (true) {
    console.log("\nTens 5 campions. Quin vols substituir?");
    team.forEach((champion, index) => {
      console.log(`${index + 1}. ${champion.name} (HP ${champion.currentHp}/${champion.maxHp})`);
    });

    const answer = await ask("Campió a substituir: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= team.length) {
      return choice - 1;
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

async function addChampionToTeam(team: Champion[], champion: Champion): Promise<void> {
  if (team.length < 5) {
    team.push(champion);
    return;
  }

  const replaceIndex = await chooseChampionToReplace(team);
  const removedChampion = team[replaceIndex];
  team[replaceIndex] = champion;
  console.log(`Has substituït ${removedChampion.name} per ${champion.name}.`);
}

async function chooseDamageTypeTarget(currentType: DamageType): Promise<DamageType> {
  const options: { label: string; value: DamageType }[] = [];

  if (currentType === DamageType.Physical) {
    options.push({ label: "Magical", value: DamageType.Magical });
    options.push({ label: "Mixed", value: DamageType.Mixed });
  } else if (currentType === DamageType.Magical) {
    options.push({ label: "Physical", value: DamageType.Physical });
    options.push({ label: "Mixed", value: DamageType.Mixed });
  } else {
    options.push({ label: "Physical", value: DamageType.Physical });
    options.push({ label: "Magical", value: DamageType.Magical });
  }

  while (true) {
    console.log("\nCap a quin tipus de dany el vols canviar?");
    options.forEach((option, index) => console.log(`${index + 1}. ${option.label}`));
    const answer = await ask("Opció: ");
    const choice = Number(answer.trim());
    if (!Number.isNaN(choice) && choice >= 1 && choice <= options.length) {
      return options[choice - 1].value;
    }
    console.log("Opció no vàlida. Torna-ho a intentar.");
  }
}

async function main(): Promise<void> {
  let currentMap = buildInitialMap();
  const run = new Run([], [], Region.Demacia);

  if (ADMIN_MODE) {
    const adminTeam = buildAdminTeam(run.region);
    adminTeam.forEach(champion => run.addChampionToPlayer(champion));
    console.log("ADMIN MODE activat: equip inicial al nivell 50.");
    console.log(`Equip inicial: ${adminTeam.map(champion => `${champion.name} (Lvl ${champion.level})`).join(", ")}`);
  } else {
    const startingChampion = createChampionInstance(getRandomChampionBase(run.region));
    run.addChampionToPlayer(startingChampion);
    console.log(`Starting champion: ${startingChampion.name}`);
  }

  const startNode = getNodeById(currentMap, currentMap.startNodeId)!;
  run.setCurrentNode(startNode);

  while (run.currentNode) {
    const node = run.currentNode;
    console.log(`\nNode actual: [${node.id}] ${NodeType[node.type]}`);

    switch (node.type) {
      case NodeType.Bard: {
        const options = getBardNodeOptions();
        console.log("Has arribat a un node de Bard. Tria una de les 3 opcions:");
        const chosenOption = await chooseBardOption(options);
        const selectedChampion = chosenOption.key === "pass-of-time"
          ? await chooseChampionForItem(run.playerTeam, "The pass of time")
          : undefined;
        const resolution = await resolveBardOption(chosenOption, run, node.depth, selectedChampion);
        console.log(resolution.message);

        if (resolution.battle) {
          await reorderTeam(run.playerTeam);
          const result = simulateBattle(run.playerTeam, resolution.battle.opponents);
          if (result !== "Team A wins") {
            console.log("GAME OVER");
            rl.close();
            return;
          }
        }

        break;
      }
      case NodeType.Recruit: {
        const options = getRecruitOptions(node.depth, run.region, currentMap.phase);
        console.log("Has arribat a un node de recruit. Tria un dels 3:");
        const chosenBase = await chooseRecruitChampion(options);
        if (!chosenBase) {
          console.log("Has decidit no reclutar cap campió.");
          break;
        }
        const chosenChampion = createChampionInstance(chosenBase);
        await addChampionToTeam(run.playerTeam, chosenChampion);
        console.log(`Has reclutat: ${chosenChampion.name}`);
        break;
      }
      case NodeType.Objects: {
        const options = getObjectNodeOptions();
        console.log("Has arribat a un node d'objectes. Tria un dels 3:");
        const chosenItem = await chooseItem(options);

        if (!canStoreInBag(chosenItem)) {
          const targetChampion = await chooseChampionForItem(run.playerTeam, chosenItem.name);
          console.log(applyItemToChampion(targetChampion, chosenItem));
          break;
        }

        const action = await ask("Vols equipar-lo o guardar-lo a la bossa? (e/b): ");
        if (action.toLowerCase() === "b") {
          run.addItemToBag(chosenItem);
          console.log(`Has guardat ${chosenItem.name} a la bossa. Total a la bossa: ${run.bag.length}`);
          break;
        }

        const eligibleChampions = run.playerTeam.filter(champion => canEquipItem(champion, chosenItem));
        if (eligibleChampions.length === 0) {
          console.log("Tots els campions ja tenen un objecte equipat. L'has de guardar a la bossa.");
          run.addItemToBag(chosenItem);
          console.log(`Has guardat ${chosenItem.name} a la bossa. Total a la bossa: ${run.bag.length}`);
          break;
        }

        const targetChampion = await chooseChampionForItem(eligibleChampions, chosenItem.name);
        if (chosenItem.effect.type === "damageTypeChoice") {
          const targetType = await chooseDamageTypeTarget(targetChampion.damageType);
          console.log(applyItemToChampion(targetChampion, chosenItem, targetType));
        } else {
          console.log(applyItemToChampion(targetChampion, chosenItem));
        }
        break;
      }
      case NodeType.Duel:
      case NodeType.Scrim:
      case NodeType.Boss: {
        const opponents = getBattleOpponents(node, run.region, currentMap);
        if (opponents.length === 0) {
          console.log("No hi ha combat disponible en aquest node.");
          break;
        }
        console.log("\nRivals:", opponents.map(c => `${c.name} (Nivell ${c.level})`).join(", "));
        await reorderTeam(run.playerTeam);
        const result = simulateBattle(run.playerTeam, opponents);
        if (result !== "Team A wins") {
          console.log("GAME OVER");
          rl.close();
          return;
        }

        if (node.type === NodeType.Boss && currentMap.phase === 1) {
          currentMap = buildSecondPhaseMap();
          const phaseTwoStartNode = getNodeById(currentMap, currentMap.startNodeId)!;
          fullHealAndRevive(run.playerTeam);
          run.setCurrentNode(phaseTwoStartNode);
          console.log("\n=== Fase 2 desbloquejada ===");
          continue;
        }

        if (node.type === NodeType.Boss && currentMap.phase === 2) {
          currentMap = buildThirdPhaseMap();
          const phaseThreeStartNode = getNodeById(currentMap, currentMap.startNodeId)!;
          fullHealAndRevive(run.playerTeam);
          run.setCurrentNode(phaseThreeStartNode);
          console.log("\n=== Fase 3 desbloquejada ===");
          continue;
        }

        if (node.type === NodeType.Boss && currentMap.phase === 3) {
          currentMap = buildFourthPhaseMap();
          const phaseFourStartNode = getNodeById(currentMap, currentMap.startNodeId)!;
          fullHealAndRevive(run.playerTeam);
          run.setCurrentNode(phaseFourStartNode);
          console.log("\n=== Fase 4 desbloquejada ===");
          continue;
        }

        if (node.type === NodeType.Boss && currentMap.phase === 4) {
          currentMap = buildFifthPhaseMap();
          const phaseFiveStartNode = getNodeById(currentMap, currentMap.startNodeId)!;
          fullHealAndRevive(run.playerTeam);
          run.setCurrentNode(phaseFiveStartNode);
          console.log("\n=== Fase final desbloquejada ===");
          continue;
        }

        if (node.type === NodeType.Boss && currentMap.phase === 5) {
          console.log("\n=== Fase final completada ===");
        }
        break;
      }
      case NodeType.Heal: {
        console.log("Has arribat a un node de curació. El teu equip es cura totalment i els morts ressusciten.");
        fullHealAndRevive(run.playerTeam); // 100% heal and resurrect all
        run.playerTeam.forEach(champ => {
          console.log(`  ${champ.name}: ${champ.currentHp}/${champ.maxHp} HP`);
        });
        break;
      }
      case NodeType.Start:
      default:
        break;
    }

    if (node.next.length === 0) {
      console.log("La run ha acabat.");
      break;
    }

    const nextNodes = node.next.map(nodeId => getNodeById(currentMap, nodeId)!).filter(Boolean);
    const chosenNode = await chooseNode(nextNodes);
    run.setCurrentNode(chosenNode);
  }

  rl.close();
}

main().catch(error => {
  console.error(error);
  rl.close();
});
