import { describe, expect, it } from "vitest";
import { FactorizationEngine } from "../game/systems/FactorizationEngine";

describe("FactorizationEngine", () => {
  it("factorizes required sample numbers", () => {
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(12))).toBe("2² × 3");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(18))).toBe("2 × 3²");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(20))).toBe("2² × 5");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(24))).toBe("2³ × 3");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(90))).toBe("2 × 3² × 5");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(32))).toBe("2⁵");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(45))).toBe("3² × 5");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(63))).toBe("3² × 7");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(70))).toBe("2 × 5 × 7");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(98))).toBe("2 × 7²");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(150))).toBe("2 × 3 × 5²");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(180))).toBe("2² × 3² × 5");
  });

  it("normalizes factors independently of selection order", () => {
    const first = FactorizationEngine.normalizeFactors([2, 3, 3, 5]);
    const second = FactorizationEngine.normalizeFactors([3, 5, 2, 3]);
    expect(FactorizationEngine.countsEqual(first, second)).toBe(true);
    expect(FactorizationEngine.formatCounts(second)).toBe("2 × 3² × 5");
  });

  it("rejects invalid prime choices and never treats 1 as prime", () => {
    expect(FactorizationEngine.canDivide(90, 7)).toBe(false);
    expect(FactorizationEngine.canDivide(1, 1)).toBe(false);
    expect(FactorizationEngine.applyFactors(90, [7])).toMatchObject({ ok: false, rejectedPrime: 7 });
  });

  it("updates the remainder for partial factor chains", () => {
    const result = FactorizationEngine.applyFactors(180, [2, 3, 5]);
    expect(result).toMatchObject({ ok: true, remainder: 6, completed: false, steps: [180, 90, 30, 6] });
  });

  it("completes prime target and repeated factors", () => {
    expect(FactorizationEngine.applyFactors(2, [2])).toMatchObject({ ok: true, remainder: 1, completed: true });
    expect(FactorizationEngine.applyFactors(32, [2, 2, 2, 2, 2])).toMatchObject({
      ok: true,
      remainder: 1,
      completed: true,
    });
  });

  it("handles prime targets", () => {
    expect(FactorizationEngine.factorize(7)).toEqual({ 7: 1 });
    expect(FactorizationEngine.applyFactors(7, [7])).toMatchObject({ ok: true, remainder: 1, completed: true });
  });

  it("supports 13 and 17 and uniqueness feedback", () => {
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(221))).toBe("13 × 17");
    expect(FactorizationEngine.formatCounts(FactorizationEngine.factorize(195))).toBe("3 × 5 × 13");
    expect(FactorizationEngine.uniquenessFeedback(180, [5, 2, 3, 3, 2])).toContain("정규형 확인");
    expect(FactorizationEngine.uniquenessFeedback(180, [5, 2, 3, 3, 2])).toContain("2² × 3² × 5");
  });
});
