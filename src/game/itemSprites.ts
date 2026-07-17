// Mapeig d'items als seus sprites.
// Els fitxers bàsics estan a src/assets/items/*.png
// Els fitxers llegendaris estan a src/assets/legendary items/*.png

const itemSpriteModules = import.meta.glob<{ default: string }>(
  ["../assets/items/*.png", "../assets/legendary items/*.png"],
  { eager: true }
);

// Construeix un mapa: nom base del fitxer (normalitzat) -> URL de la imatge.
const itemSprites: Record<string, string> = {};

for (const [path, module] of Object.entries(itemSpriteModules)) {
  const fileName = path.split("/").pop() ?? "";
  const baseName = fileName.replace(/\.png$/i, "");
  // Normalitza: minúscules, sense espais ni símbols
  const key = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
  itemSprites[key] = module.default;
}

// Mapeja el nom de l'item al nom del fitxer de sprite.
const itemNameToSpriteFile: Record<string, string> = {
  "Long Sword": "Long Sword",
  "Magic Tome": "Magic tome",
  "Ruby Crystal": "Ruby cristal",
  "Cloth Armor": "Cloth armor",
  "Null Magic Mantle": "Null-magic mantle",
  "Dagger": "Dagger",
  "+1 level": "+1 Level",
  "Damage Shifter": "Shift damage",
  "Infinity Edge": "Infinity Edge",
  "Luden's Echo": "Luden's echo",
  "Warmog's Armor": "Warmog's armor",
  "Sunfire Cape": "Sunfire cape",
  "Force of Nature": "Force of nature",
  "Phantom Dancer": "Phantom Dancer",
};

export function getItemSprite(itemName: string): string | undefined {
  const spriteFile = itemNameToSpriteFile[itemName];
  if (!spriteFile) return undefined;
  const key = spriteFile.toLowerCase().replace(/[^a-z0-9]/g, "");
  return itemSprites[key];
}
