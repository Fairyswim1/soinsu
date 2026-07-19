import type { Prime, SpecialCandy } from "../models/CandyModel";

export type SpecialAward = {
  special?: SpecialCandy;
  label?: string;
};

export class SpecialCandySystem {
  static evaluate(factors: readonly Prime[], completed: boolean): SpecialAward {
    const sameCount = new Map<Prime, number>();
    for (const factor of factors) {
      sameCount.set(factor, (sameCount.get(factor) ?? 0) + 1);
    }
    if ([...sameCount.values()].some((count) => count >= 3)) {
      return { special: "exponentBomb", label: "지수 폭탄 생성!" };
    }
    if (factors.length >= 4) {
      return { special: completed ? "rainbowPrime" : "rocketH", label: completed ? "무지개 프라임!" : "소수 로켓!" };
    }
    return {};
  }
}
