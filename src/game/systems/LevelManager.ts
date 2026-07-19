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
      moves: 38,
      timeLimitSeconds: 150,
      availablePrimes: [2, 3, 5, 7],
      obstacles: [],
      starThresholds: [3200, 5200, 7400],
      hintPolicy: "manual",
      wrongDragPenalty: true,
      specialsEnabled: true,
      objectives: { maxDragsPerTarget: 2, minLongChains: 4, longChainLength: 4, collectPrimes: { 3: 6, 7: 3 } },
    };
  }

  static classroomLevel(): LevelConfig {
    return {
      id: 2001,
      title: "교실 모드",
      targets: [60, 72, 84, 90],
      moves: 28,
      timeLimitSeconds: 180,
      availablePrimes: [2, 3, 5, 7],
      obstacles: [],
      starThresholds: [2200, 3600, 5200],
      hintPolicy: "manual",
      wrongDragPenalty: false,
      specialsEnabled: false,
      objectives: { maxDragsPerTarget: 3, minLongChains: 2, longChainLength: 3, collectPrimes: { 2: 6, 3: 4 } },
    };
  }
}
