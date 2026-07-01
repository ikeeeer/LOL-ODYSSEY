import type { Champion } from "./types";
import type { InventoryItem } from "./types";
import { Region } from "./types";
import type { MapNode } from "./map";

export class Run {
  public playerTeam: Champion[];
  public enemyTeam: Champion[];
  public region: Region;
  public gold: number;
  public essence: number;
  public round: number;
  public currentNode: MapNode | null;
  public bag: InventoryItem[];

  constructor(playerTeam: Champion[], enemyTeam: Champion[], region: Region = Region.Demacia) {
    this.playerTeam = playerTeam;
    this.enemyTeam = enemyTeam;
    this.region = region;
    this.gold = 0;
    this.essence = 0;
    this.round = 1;
    this.currentNode = null;
    this.bag = [];
  }

  setCurrentNode(node: MapNode): void {
    this.currentNode = node;
  }

  addChampionToPlayer(champion: Champion): void {
    this.playerTeam.push(champion);
  }

  addChampionToEnemy(champion: Champion): void {
    this.enemyTeam.push(champion);
  }

  addItemToBag(item: InventoryItem): void {
    this.bag.push(item);
  }

  advanceRound(): void {
    this.round += 1;
  }
}

