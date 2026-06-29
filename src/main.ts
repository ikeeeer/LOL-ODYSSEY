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
import { Region, ChampionBase } from "./game/types";

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
    console.log(`${index + 1}. ${champion.name} (Lvl ${champion.level}) - HP ${champion.maxHp}, ATK ${champion.attack}, DEF ${champion.defense}, SPD ${champion.speed}`);
  });
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
      case NodeType.Duel:
      case NodeType.Scrim:
      case NodeType.Boss: {
        const opponents = getBattleOpponents(node, run.region);
        if (opponents.length === 0) {
          console.log("No hi ha combat disponible en aquest node.");
          break;
        }
        console.log("Combat contra:", opponents.map(c => `${c.name} (Nivell ${c.level})`).join(", "));
        const result = simulateBattle(run.playerTeam, opponents, node.type === NodeType.Duel);
        console.log(result);
        if (result !== "Team A wins") {
          console.log("GAME OVER");
          rl.close();
          return;
        }
        break;
      }
      case NodeType.Heal: {
        console.log("Has arribat a un node de curació. El teu equip es cura totalment.");
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
