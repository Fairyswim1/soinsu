import { scoringConfig } from "../config/scoring";
import type { Prime } from "../models/CandyModel";
import type { GameSession } from "../models/GameSession";
import { FactorizationEngine } from "./FactorizationEngine";

export type ScoreResult = {
  gained: number;
  labels: string[];
};

export class ScoreSystem {
  static scoreSelection(session: GameSession, factors: readonly Prime[], completed: boolean): ScoreResult {
    const labels: string[] = ["FACTOR POP!"];
    const chainScore =
      scoringConfig.chainScores[Math.min(factors.length, scoringConfig.chainScores.length - 1)] ??
      factors.reduce<number>((sum, _factor, index) => sum + scoringConfig.baseCandy + index * scoringConfig.chainStep, 0);
    let gained = chainScore;
    const counts = FactorizationEngine.normalizeFactors(factors);
    if (Object.values(counts).some((count) => (count ?? 0) >= 2)) {
      gained += scoringConfig.exponentBonus;
      labels.push("EXPONENT COMBO!");
    }
    if (factors.length >= 4) {
      gained += scoringConfig.longChainBonus;
      labels.push("PRIME CHAIN!");
    }
    if (completed) {
      labels.push("소인수분해 완료!");
      if (session.currentRemainder === session.originalTarget) {
        gained += scoringConfig.perfectFactor;
        labels.push("PERFECT FACTORIZATION!");
      }
      if (session.hintsUsed === 0) {
        gained += scoringConfig.noHint;
        labels.push("NO HINT BONUS!");
      }
      gained += session.movesLeft * scoringConfig.moveBonus;
      gained += session.timeLeftSeconds * 12;
    }
    const comboMultiplier = 1 + session.combo * scoringConfig.comboStep;
    return { gained: Math.round(gained * comboMultiplier), labels };
  }

  static stars(score: number, thresholds: readonly [number, number, number]): number {
    if (score >= thresholds[2]) return 3;
    if (score >= thresholds[1]) return 2;
    if (score >= thresholds[0]) return 1;
    return 0;
  }
}
