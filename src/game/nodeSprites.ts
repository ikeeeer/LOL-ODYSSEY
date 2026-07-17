// Mapeig de tipus de node als seus sprites.
// Els fitxers estan a src/assets/node sprites/*.png
// Usem import.meta.glob de Vite per carregar tots els sprites de manera eager.

const nodeSpriteModules = import.meta.glob<{ default: string }>(
  "../assets/node sprites/*.png",
  { eager: true }
);

// Construeix un mapa: nom base del fitxer -> URL de la imatge.
const nodeSprites: Record<string, string> = {};

for (const [path, module] of Object.entries(nodeSpriteModules)) {
  const fileName = path.split("/").pop() ?? "";
  const baseName = fileName.replace(/\.png$/i, "");
  nodeSprites[baseName] = module.default;
}

export function getNodeSprite(name: string): string | undefined {
  return nodeSprites[name];
}
