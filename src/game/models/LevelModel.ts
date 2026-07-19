import type { Prime } from "./CandyModel";
import type { BlockerConfig } from "./BlockerModel";

export type LevelObjectives = {
  maxDragsPerTarget?: number;
  minLongChains?: number;
  longChainLength?: number;
  collectPrimes?: Partial<Record<Prime, number>>;
};

export type LevelConfig = {
  id: number;
  title: string;
  targets: number[];
  moves: number;
  timeLimitSeconds: number;
  availablePrimes: Prime[];
  obstacles: BlockerConfig[];
  starThresholds: [number, number, number];
  hintPolicy: "auto" | "manual" | "off";
  wrongDragPenalty: boolean;
  specialsEnabled: boolean;
  objectives: LevelObjectives;
};
