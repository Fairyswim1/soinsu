import { describe, expect, it } from "vitest";
import { levels } from "../game/config/levels";
import type { Board } from "../game/models/CandyModel";
import { createSession } from "../game/models/GameSession";
import { HintSystem } from "../game/systems/HintSystem";
import { ScoreSystem } from "../game/systems/ScoreSystem";

describe("ScoreSystem and HintSystem", () => {
  it("scores moves and gives exponent labels", () => {
    const session = createSession("campaign", levels[0]!);
    const result = ScoreSystem.scoreSelection(session, [2, 2, 3], true);
    expect(result.gained).toBeGreaterThan(0);
    expect(result.labels).toContain("EXPONENT COMBO!");
    expect(result.parts.exponent).toBe(300);
    expect(result.parts.chain).toBeGreaterThan(0);
  });

  it("rewards longer chains more than single taps", () => {
    const session = createSession("campaign", levels[3]!);
    const single = ScoreSystem.scoreSelection(session, [2], false);
    const long = ScoreSystem.scoreSelection(session, [2, 3, 3, 5], false);
    expect(long.gained).toBeGreaterThan(single.gained * 4);
    expect(long.labels).toContain("PRIME CHAIN!");
  });

  it("scores obstacle and special clears", () => {
    const obstacle = ScoreSystem.scoreObstacleHits(2, 1);
    expect(obstacle.gained).toBe(2 * 75 + 120);
    expect(obstacle.parts.obstacle).toBe(obstacle.gained);
    const special = ScoreSystem.scoreSpecialClears(3);
    expect(special.gained).toBe(180);
    expect(special.labels[0]).toContain("소인수 미포함");
  });

  it("creates only valid prime hints", () => {
    const board: Board = [
      [{ id: "a", prime: 7, row: 0, col: 0 }],
      [{ id: "b", prime: 3, row: 1, col: 0 }],
    ];
    const hint = HintSystem.createHint(board, 45, 3);
    expect(hint.validPrimes).toEqual([3]);
    expect(hint.message).toContain("3");
  });

  it("calculates stars from configured thresholds", () => {
    expect(ScoreSystem.stars(100, [200, 400, 600])).toBe(0);
    expect(ScoreSystem.stars(400, [200, 400, 600])).toBe(2);
    expect(ScoreSystem.stars(700, [200, 400, 600])).toBe(3);
  });
});
