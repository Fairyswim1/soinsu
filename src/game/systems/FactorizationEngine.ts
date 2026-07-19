import type { Prime } from "../models/CandyModel";
import { isPrimeCandy, supportedPrimes } from "../models/CandyModel";
import { toSuperscript } from "../utils/math";

export type FactorCounts = Partial<Record<Prime, number>>;

export type ApplyResult =
  | {
      ok: true;
      remainder: number;
      used: Prime[];
      completed: boolean;
      steps: number[];
    }
  | {
      ok: false;
      rejectedPrime: number;
      remainder: number;
      message: string;
    };

export class FactorizationEngine {
  static isPrime(value: number): value is Prime {
    return isPrimeCandy(value);
  }

  static factorize(value: number): FactorCounts {
    if (!Number.isInteger(value) || value < 2) {
      return {};
    }
    let remainder = value;
    const counts: FactorCounts = {};
    for (const prime of supportedPrimes) {
      while (remainder % prime === 0) {
        counts[prime] = (counts[prime] ?? 0) + 1;
        remainder /= prime;
      }
    }
    if (remainder > 1 && isPrimeCandy(remainder)) {
      counts[remainder] = (counts[remainder] ?? 0) + 1;
    }
    return counts;
  }

  static normalizeFactors(factors: readonly Prime[]): FactorCounts {
    return factors.reduce<FactorCounts>((counts, factor) => {
      counts[factor] = (counts[factor] ?? 0) + 1;
      return counts;
    }, {});
  }

  static canDivide(remainder: number, prime: number): prime is Prime {
    return isPrimeCandy(prime) && remainder > 1 && remainder % prime === 0;
  }

  static applyFactors(currentRemainder: number, factors: readonly Prime[]): ApplyResult {
    if (factors.length === 0) {
      return {
        ok: false,
        rejectedPrime: 0,
        remainder: currentRemainder,
        message: "연결한 소수 사탕이 없어요.",
      };
    }
    let remainder = currentRemainder;
    const steps = [remainder];
    const used: Prime[] = [];
    for (const factor of factors) {
      if (!this.canDivide(remainder, factor)) {
        return {
          ok: false,
          rejectedPrime: factor,
          remainder,
          message: `${factor}은 현재 수 ${remainder}을 나눌 수 없어요.`,
        };
      }
      remainder /= factor;
      used.push(factor);
      steps.push(remainder);
    }
    return {
      ok: true,
      remainder,
      used,
      completed: remainder === 1,
      steps,
    };
  }

  static formatFactors(factors: readonly Prime[]): string {
    const counts = this.normalizeFactors(factors);
    return this.formatCounts(counts);
  }

  static formatCounts(counts: FactorCounts): string {
    return supportedPrimes
      .filter((prime) => (counts[prime] ?? 0) > 0)
      .map((prime) => {
        const count = counts[prime] ?? 0;
        return count === 1 ? `${prime}` : `${prime}${toSuperscript(count)}`;
      })
      .join(" × ");
  }

  static formatEquation(target: number, factors: readonly Prime[]): string {
    const expression = this.formatFactors(factors);
    return `${target} = ${expression || "?"}`;
  }

  /** 선택 순서와 무관한 정규형 문자열 */
  static formatCanonical(target: number): string {
    return this.formatCounts(this.factorize(target));
  }

  /** 플레이어 결과와 정규형이 같은지 확인하는 학습 피드백 */
  static uniquenessFeedback(target: number, factors: readonly Prime[]): string {
    const canonical = this.formatCanonical(target);
    const player = this.normalizeFactors(factors);
    const expected = this.factorize(target);
    if (this.countsEqual(player, expected)) {
      return `정규형 확인: ${target} = ${canonical} (순서가 달라도 같아요!)`;
    }
    return `${target} = ${this.formatFactors(factors)}`;
  }

  static countsEqual(left: FactorCounts, right: FactorCounts): boolean {
    return supportedPrimes.every((prime) => (left[prime] ?? 0) === (right[prime] ?? 0));
  }

  static validPrimesFor(remainder: number, availablePrimes: readonly Prime[]): Prime[] {
    return availablePrimes.filter((prime) => this.canDivide(remainder, prime));
  }
}
