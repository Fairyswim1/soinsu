export type AssetEntry = {
  key: string;
  path: string;
  type: "image" | "audio";
};

export const assetManifest: AssetEntry[] = [
  { key: "prime-2", path: "assets/candies/prime-2.webp", type: "image" },
  { key: "prime-3", path: "assets/candies/prime-3.webp", type: "image" },
  { key: "prime-5", path: "assets/candies/prime-5.webp", type: "image" },
  { key: "prime-7", path: "assets/candies/prime-7.webp", type: "image" },
  { key: "prime-11", path: "assets/candies/prime-11.webp", type: "image" },
  { key: "bgm-game", path: "assets/audio/bgm-game.ogg", type: "audio" },
  { key: "candy-select", path: "assets/audio/candy-select.ogg", type: "audio" },
  { key: "candy-invalid", path: "assets/audio/candy-invalid.ogg", type: "audio" },
  { key: "perfect", path: "assets/audio/perfect.ogg", type: "audio" },
];
