import { levels } from "../config/levels";
import type { LevelConfig } from "../models/LevelModel";

export class LevelManager {
  static getLevel(id: number): LevelConfig {
    return levels.find((level) => level.id === id) ?? levels[0]!;
  }

  static quickPracticeLevel(): LevelConfig {
    return {
      id: 1001,
      title: "빠른 연습",
      targets: [36, 45, 60, 72, 84, 90],
      moves: 22,
      timeLimitSeconds: 135,
      availablePrimes: [2, 3, 5, 7],
      obstacles: [],
      starThresholds: [6200, 9800, 13800],
      hintPolicy: "manual",
      wrongDragPenalty: true,
      specialsEnabled: true,
      boardTuning: { validDensityLimit: 0.29, adjacentValidSuppression: 0.76 },
      objectives: { maxDragsPerTarget: 2, minLongChains: 4, longChainLength: 4, collectPrimes: { 3: 6, 7: 3 } },
    };
  }

  static classroomLevel(): LevelConfig {
    return {
      id: 2001,
      title: "교실 모드",
      targets: [60, 72, 84, 90],
      moves: 18,
      timeLimitSeconds: 180,
      availablePrimes: [2, 3, 5, 7],
      obstacles: [],
      starThresholds: [4200, 6800, 9600],
      hintPolicy: "manual",
      wrongDragPenalty: false,
      specialsEnabled: false,
      boardTuning: { validDensityLimit: 0.36, adjacentValidSuppression: 0.5 },
      objectives: { maxDragsPerTarget: 3, minLongChains: 2, longChainLength: 3, collectPrimes: { 2: 6, 3: 4 } },
    };
  }
}
