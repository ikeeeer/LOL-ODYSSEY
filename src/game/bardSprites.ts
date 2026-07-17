// Mapeig d'opcions del Bard als seus sprites.
// Els fitxers estan a src/assets/bard/*.png

const bardSpriteModules = import.meta.glob<{ default: string }>(
  "../assets/bard/*.png",
  { eager: true }
);

const bardSprites: Record<string, string> = {};

for (const [path, module] of Object.entries(bardSpriteModules)) {
  const fileName = path.split("/").pop() ?? "";
  const baseName = fileName.replace(/\.png$/i, "");
  // Normalitza: minúscules, sense espais ni símbols
  const key = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
  bardSprites[key] = module.default;
}

// Mapeja la clau de l'opció del Bard al nom del fitxer de sprite.
const bardKeyToSpriteFile: Record<string, string> = {
  "lost-meep": "The lost meep",
  "misterious-portal": "Mysterious portal",
  "sacrifice": "Sacrifice",
  "bards-melody": "Bard's melody",
  "pass-of-time": "Pass of time",
  "old-age": "Old age",
};

export function getBardSprite(optionKey: string): string | undefined {
  const spriteFile = bardKeyToSpriteFile[optionKey];
  if (!spriteFile) return undefined;
  const key = spriteFile.toLowerCase().replace(/[^a-z0-9]/g, "");
  return bardSprites[key];
}
