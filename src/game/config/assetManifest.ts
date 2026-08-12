import {
  PRIME_POP_BOARD_ASSETS,
  PRIME_POP_BUTTON_ASSETS,
  PRIME_POP_EFFECT_ASSETS,
  PRIME_POP_GAMEPLAY_ASSETS,
  PRIME_POP_HUD_ASSETS,
  PRIME_POP_SCREEN_ASSETS,
  PRIME_POP_WORLD_MAP_ASSETS,
  PRIME_TILE_ASSETS,
  primeTileKey,
} from "./primePopAssets";

export type AssetEntry = {
  key: string;
  path: string;
  type: "image" | "audio";
};

export const assetManifest: AssetEntry[] = [
  ...Object.entries(PRIME_TILE_ASSETS).map(([prime, path]) => ({
    key: primeTileKey(Number(prime)),
    path,
    type: "image" as const,
  })),
  ...Object.values(PRIME_POP_BOARD_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
  ...Object.values(PRIME_POP_BUTTON_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
  ...Object.values(PRIME_POP_HUD_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
  ...Object.values(PRIME_POP_EFFECT_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
  ...Object.values(PRIME_POP_GAMEPLAY_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
  ...Object.values(PRIME_POP_SCREEN_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
  ...Object.values(PRIME_POP_WORLD_MAP_ASSETS).map(({ key, path }) => ({ key, path, type: "image" as const })),
];
