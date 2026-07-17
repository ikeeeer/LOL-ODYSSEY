// Mapeig de noms de campió als seus sprites.
// Els fitxers estan a src/assets/champions/*.png
// Usem import.meta.glob de Vite per carregar tots els sprites de manera eager.

const spriteModules = import.meta.glob<{ default: string }>("../assets/champions/*.png", {
  eager: true,
});

// Noms de campió que tenen un nom de fitxer diferent al nom del campió.
const championFileAliases: Record<string, string> = {
  "Jarvan IV": "Jarvan",
  "Xin Zhao": "Xin",
};

// Construeix un mapa: nom del campió -> URL de la imatge.
const championSprites: Record<string, string> = {};

for (const [path, module] of Object.entries(spriteModules)) {
  // path té la forma "../assets/champions/Fiora.png"
  const fileName = path.split("/").pop() ?? "";
  const baseName = fileName.replace(/\.png$/i, "");
  championSprites[baseName] = module.default;
}

// Normalitza un nom de campió per trobar el sprite corresponent.
function resolveSpriteKey(championName: string): string {
  if (championFileAliases[championName]) {
    return championFileAliases[championName];
  }
  return championName;
}

export function getChampionSprite(championName: string): string | undefined {
  const key = resolveSpriteKey(championName);
  return championSprites[key];
}
