import { levels } from "../config/levels";
import type { Prime } from "../models/CandyModel";
import type { LevelConfig } from "../models/LevelModel";
import { SeededRandom } from "../utils/random";

export class LevelManager {
  static getLevel(id: number): LevelConfig {
    return this.withGeneratedTargets(levels.find((level) => level.id === id) ?? levels[0]!);
  }

  static quickPracticeLevel(): LevelConfig {
    return this.withGeneratedTargets({
      id: 1001,
      title: "빠른 연습",
      targets: [36, 45, 60, 72, 84, 90],
      targetRules: { targetCount: 6, factorCountRange: [3, 5], digitRange: [2, 3] },
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
    });
  }

  static classroomLevel(): LevelConfig {
    return this.withGeneratedTargets({
      id: 2001,
      title: "대결 모드",
      targets: [60, 72, 84, 90],
      targetRules: { targetCount: 1, factorCountRange: [3, 5], digitRange: [2, 3] },
      moves: 5,
      timeLimitSeconds: 60,
      availablePrimes: [2, 3, 5, 7],
      obstacles: [],
      starThresholds: [1200, 2200, 3400],
      hintPolicy: "manual",
      wrongDragPenalty: false,
      specialsEnabled: false,
      boardTuning: { validDensityLimit: 0.36, adjacentValidSuppression: 0.5 },
      objectives: { maxDragsPerTarget: 2, minLongChains: 1, longChainLength: 4 },
    });
  }

  static describeTargetRules(level: LevelConfig): string {
    const rules = level.targetRules;
    if (!rules) return `목표 수: ${level.targets.join(", ")}`;
    const [minFactors, maxFactors] = rules.factorCountRange;
    const [minDigits, maxDigits] = rules.digitRange;
    const factorLabel = minFactors === maxFactors ? `${minFactors}개 소인수` : `${minFactors}-${maxFactors}개 소인수`;
    const digitLabel = minDigits === maxDigits ? `${minDigits}자리` : `${minDigits}-${maxDigits}자리`;
    return `목표 규칙: ${digitLabel}, ${factorLabel}`;
  }

  private static withGeneratedTargets(level: LevelConfig): LevelConfig {
    if (!level.targetRules) {
      const targets = [...level.targets];
      return { ...level, targets, starThresholds: this.estimateStarThresholds(targets, level) };
    }
    const targets = this.generateTargets(level);
    return {
      ...level,
      targets,
      obstacles: [...level.obstacles],
      availablePrimes: [...level.availablePrimes],
      starThresholds: this.estimateStarThresholds(targets, level),
    };
  }

  private static generateTargets(level: LevelConfig): number[] {
    const rules = level.targetRules;
    if (!rules) return [...level.targets];
    const random = new SeededRandom((Date.now() + level.id * 9973) % 0xffffffff);
    const targets: number[] = [];
    const seen = new Set<number>();
    const maxAttempts = rules.targetCount * 120;

    for (let attempt = 0; targets.length < rules.targetCount && attempt < maxAttempts; attempt += 1) {
      const factorCount = this.randomInRange(random, rules.factorCountRange);
      const candidate = this.composeTarget(random, level.availablePrimes, factorCount);
      const digits = String(candidate).length;
      if (digits < rules.digitRange[0] || digits > rules.digitRange[1] || seen.has(candidate)) continue;
      seen.add(candidate);
      targets.push(candidate);
    }

    for (const fallback of level.targets) {
      if (targets.length >= rules.targetCount) break;
      if (!seen.has(fallback)) {
        seen.add(fallback);
        targets.push(fallback);
      }
    }
    return targets;
  }

  private static composeTarget(random: SeededRandom, primes: readonly Prime[], factorCount: number): number {
    let target = 1;
    for (let index = 0; index < factorCount; index += 1) {
      target *= random.pick(primes);
    }
    return target;
  }

  private static randomInRange(random: SeededRandom, [min, max]: [number, number]): number {
    return min + random.integer(max - min + 1);
  }

  private static estimateStarThresholds(targets: readonly number[], level: LevelConfig): [number, number, number] {
    const maximum = targets.reduce((sum, target) => {
      const factorCount = this.countPrimeFactors(target, level.availablePrimes);
      const gemScore = factorCount * 100;
      const longChainScore = Math.max(0, factorCount - 3) * 100;
      return sum + gemScore + longChainScore + 500 + 300;
    }, this.hasObjectives(level) ? 500 : 0);
    return [this.roundScore(maximum * 0.55), this.roundScore(maximum * 0.75), this.roundScore(maximum * 0.95)];
  }

  private static countPrimeFactors(target: number, primes: readonly Prime[]): number {
    let remainder = target;
    let count = 0;
    for (const prime of primes) {
      while (remainder % prime === 0) {
        remainder /= prime;
        count += 1;
      }
    }
    return remainder === 1 ? count : Math.max(1, count);
  }

  private static hasObjectives(level: LevelConfig): boolean {
    return Boolean(
      level.objectives.maxDragsPerTarget ||
        level.objectives.minLongChains ||
        (level.objectives.collectPrimes && Object.keys(level.objectives.collectPrimes).length > 0),
    );
  }

  private static roundScore(score: number): number {
    return Math.max(100, Math.round(score / 100) * 100);
  }
}
