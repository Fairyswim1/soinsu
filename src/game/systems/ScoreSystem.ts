import { scoringConfig } from "../config/scoring";
import type { Prime } from "../models/CandyModel";
import type { GameSession, ScoreBreakdown } from "../models/GameSession";
import { FactorizationEngine } from "./FactorizationEngine";

export type ScoreResult = {
  gained: number;
  labels: string[];
  parts: ScoreBreakdown;
};

export class ScoreSystem {
  static emptyBreakdown(): ScoreBreakdown {
    return {
      chain: 0,
      exponent: 0,
      longChain: 0,
      perfect: 0,
      noHint: 0,
      resources: 0,
      obstacle: 0,
      special: 0,
      objective: 0,
      comboBonus: 0,
    };
  }

  static scoreSelection(session: GameSession, factors: readonly Prime[], completed: boolean): ScoreResult {
    const labels: string[] = ["FACTOR POP!"];
    const parts = this.emptyBreakdown();
    parts.chain =
      scoringConfig.chainScores[Math.min(factors.length, scoringConfig.chainScores.length - 1)] ??
      factors.reduce<number>((sum, _factor, index) => sum + scoringConfig.baseCandy + index * scoringConfig.chainStep, 0);

    const counts = FactorizationEngine.normalizeFactors(factors);
    if (Object.values(counts).some((count) => (count ?? 0) >= 2)) {
      parts.exponent = scoringConfig.exponentBonus;
      labels.push("EXPONENT COMBO!");
    }
    if (factors.length >= 4) {
      parts.longChain = scoringConfig.longChainBonus;
      labels.push("PRIME CHAIN!");
    }
    if (completed) {
      labels.push("소인수분해 완료!");
      if (session.currentRemainder === session.originalTarget) {
        parts.perfect = scoringConfig.perfectFactor;
        labels.push("PERFECT FACTORIZATION!");
      }
      if (session.hintsUsed === 0) {
        parts.noHint = scoringConfig.noHint;
        labels.push("NO HINT BONUS!");
      }
      parts.resources =
        session.movesLeft * scoringConfig.moveBonus + session.timeLeftSeconds * scoringConfig.timeBonusPerSecond;
    }

    const preCombo =
      parts.chain + parts.exponent + parts.longChain + parts.perfect + parts.noHint + parts.resources;
    const comboMultiplier = 1 + session.combo * scoringConfig.comboStep;
    const gained = Math.round(preCombo * comboMultiplier);
    parts.comboBonus = gained - preCombo;
    if (parts.comboBonus > 0) {
      labels.push(`COMBO x${(comboMultiplier).toFixed(2)}`);
    }
    return { gained, labels, parts };
  }

  static scoreObstacleHits(damagedCount: number, clearedCount: number): ScoreResult {
    const parts = this.emptyBreakdown();
    parts.obstacle =
      damagedCount * scoringConfig.obstacleDamage + clearedCount * scoringConfig.obstacleClear;
    const labels = parts.obstacle > 0 ? ["장애물 타격!"] : [];
    if (clearedCount > 0) labels.push("합성수 분해 완료!");
    return { gained: parts.obstacle, labels, parts };
  }

  static scoreSpecialClears(count: number): ScoreResult {
    const parts = this.emptyBreakdown();
    parts.special = count * scoringConfig.specialClear;
    return {
      gained: parts.special,
      labels: count > 0 ? ["특수 클리어 (소인수 미포함)"] : [],
      parts,
    };
  }

  static scoreObjectiveBonus(): ScoreResult {
    const parts = this.emptyBreakdown();
    parts.objective = scoringConfig.objectiveBonus;
    return { gained: parts.objective, labels: ["미션 보너스!"], parts };
  }

  static mergeBreakdown(target: ScoreBreakdown, add: ScoreBreakdown): void {
    target.chain += add.chain;
    target.exponent += add.exponent;
    target.longChain += add.longChain;
    target.perfect += add.perfect;
    target.noHint += add.noHint;
    target.resources += add.resources;
    target.obstacle += add.obstacle;
    target.special += add.special;
    target.objective += add.objective;
    target.comboBonus += add.comboBonus;
  }

  static formatBreakdown(parts: ScoreBreakdown): string[] {
    const rows: Array<[string, number]> = [
      ["체인", parts.chain],
      ["지수", parts.exponent],
      ["긴 연결", parts.longChain],
      ["퍼펙트", parts.perfect],
      ["노힌트", parts.noHint],
      ["남은 이동·시간", parts.resources],
      ["장애물", parts.obstacle],
      ["특수 클리어", parts.special],
      ["미션", parts.objective],
      ["콤보 가산", parts.comboBonus],
    ];
    return rows.filter(([, value]) => value !== 0).map(([label, value]) => `${label}: ${value}`);
  }

  static stars(score: number, thresholds: readonly [number, number, number]): number {
    if (score >= thresholds[2]) return 3;
    if (score >= thresholds[1]) return 2;
    if (score >= thresholds[0]) return 1;
    return 0;
  }
}
