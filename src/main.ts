import readline from "readline";
import { simulateBattle } from "./game/battle";
import { createChampionInstance, DEMACIA_CHAMPIONS } from "./game/champions";
import {
  buildInitialMap,
  getNodeById,
  getBattleOpponents,
  getRecruitOptions,
  getChooseNewChampOptions,
  NodeType,
  MapNode
} from "./game/map";
import { Run } from "./game/run";
import { Region, ChampionBase, Champion, DamageType } from "./game/types";
import { levelUpTeam, healTeam, fullHealAndRevive } from "./game/leveling";
import { applyItemToChampion, canEquipItem, canStoreInBag, formatItemEffect, getObjectNodeOptions } from "./game/items";

function getRandomChampionBase(region: Region = Region.Demacia) {
  const options = DEMACIA_CHAMPIONS.filter(champion => champion.region === region);
  return options[Math.floor(Math.random() * options.length)];
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
    const damageTypeStr = champion.damageType === DamageType.Physical ? "Physical" : champion.damageType === DamageType.Magical ? "Magical" : "Mixed";
    console.log(`${index + 1}. ${champion.name} (Lvl ${champion.level}) [${damageTypeStr}] - HP ${champion.maxHp}, ATK ${champion.attack}, AP ${champion.ap}, ARM ${champion.armor}, MR ${champion.magic_resist}, SPD ${champion.speed}`);
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
  const map = buildInitialMap();
  const run = new Run([], [], Region.Demacia);
  const startingChampion = createChampionInstance(getRandomChampionBase(run.region));
  run.addChampionToPlayer(startingChampion);

  console.log(`Starting champion: ${startingChampion.name}`);

  const startNode = getNodeById(map, map.startNodeId)!;
  run.setCurrentNode(startNode);

  while (run.currentNode) {
    const node = run.currentNode;
    console.log(`\nNode actual: [${node.id}] ${NodeType[node.type]}`);

    switch (node.type) {
      case NodeType.ChooseNewChamp: {
        const options = getChooseNewChampOptions(node.depth, run.region);
        console.log("Has arribat a un node de selecció de champion. Tria un dels 3:");
        const chosenBase = await chooseChampion(options);
        const chosenChampion = createChampionInstance(chosenBase);
        run.addChampionToPlayer(chosenChampion);
        console.log(`Has triat: ${chosenChampion.name}`);
        break;
      }
      case NodeType.Recruit: {
        const options = getRecruitOptions(node.depth, run.region);
        console.log("Has arribat a un node de recruit. Tria un dels 3:");
        const chosenBase = await chooseChampion(options);
        const chosenChampion = createChampionInstance(chosenBase);
        run.addChampionToPlayer(chosenChampion);
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
        const opponents = getBattleOpponents(node, run.region);
        if (opponents.length === 0) {
          console.log("No hi ha combat disponible en aquest node.");
          break;
        }
        console.log("\nRivals:", opponents.map(c => `${c.name} (Nivell ${c.level})`).join(", "));
        await reorderTeam(run.playerTeam);
        const result = simulateBattle(run.playerTeam, opponents, node.type === NodeType.Duel);
        if (result !== "Team A wins") {
          console.log("GAME OVER");
          rl.close();
          return;
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

    const nextNodes = node.next.map(nodeId => getNodeById(map, nodeId)!).filter(Boolean);
    const chosenNode = await chooseNode(nextNodes);
    run.setCurrentNode(chosenNode);
  }

  rl.close();
}

main().catch(error => {
  console.error(error);
  rl.close();
});
