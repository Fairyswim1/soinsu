import type { Prime } from "./CandyModel";
import type { LevelConfig } from "./LevelModel";

export type GameMode = "campaign" | "quick" | "classroom" | "tutorial";

export type GameSession = {
  mode: GameMode;
  level: LevelConfig;
  targetIndex: number;
  originalTarget: number;
  currentRemainder: number;
  selectedFactors: Prime[];
  movesLeft: number;
  timeLeftSeconds: number;
  score: number;
  combo: number;
  hintsUsed: number;
  longestChain: number;
  correctSelections: number;
  invalidSelections: number;
  completedTargets: number;
  currentTargetDragCount: number;
  targetsCompletedWithinDragGoal: number;
  perfectTargetCount: number;
  longChainsCompleted: number;
  collectedPrimes: Partial<Record<Prime, number>>;
  objectiveBonusAwarded: boolean;
  autoShuffleCount: number;
  startedAtMs: number;
  endedAtMs?: number;
  completedFactorizations: Array<{
    target: number;
    factors: Prime[];
  }>;
};

export function createSession(mode: GameMode, level: LevelConfig): GameSession {
  const originalTarget = level.targets[0] ?? 12;
  return {
    mode,
    level,
    targetIndex: 0,
    originalTarget,
    currentRemainder: originalTarget,
    selectedFactors: [],
    movesLeft: level.moves,
    timeLeftSeconds: level.timeLimitSeconds,
    score: 0,
    combo: 0,
    hintsUsed: 0,
    longestChain: 0,
    correctSelections: 0,
    invalidSelections: 0,
    completedTargets: 0,
    currentTargetDragCount: 0,
    targetsCompletedWithinDragGoal: 0,
    perfectTargetCount: 0,
    longChainsCompleted: 0,
    collectedPrimes: {},
    objectiveBonusAwarded: false,
    autoShuffleCount: 0,
    startedAtMs: Date.now(),
    completedFactorizations: [],
  };
}
