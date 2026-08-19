import { describe, expect, it } from "vitest";
import { levels } from "../game/config/levels";
import type { Board } from "../game/models/CandyModel";
import { createSession } from "../game/models/GameSession";
import { HintSystem } from "../game/systems/HintSystem";
import { ScoreSystem } from "../game/systems/ScoreSystem";

describe("ScoreSystem and HintSystem", () => {
  it("scores a completed factorization with predictable parts", () => {
    const session = createSession("campaign", levels[0]!);
    const result = ScoreSystem.scoreSelection(session, [2, 2, 3], true);
    expect(result.gained).toBe(1100);
    expect(result.labels).toContain("분해 성공!");
    expect(result.parts.chain).toBe(300);
    expect(result.parts.exponent).toBe(500);
    expect(result.parts.perfect).toBe(300);
    expect(result.parts.resources).toBe(0);
  });

  it("rewards longer chains more than single taps", () => {
    const session = createSession("campaign", levels[3]!);
    const single = ScoreSystem.scoreSelection(session, [2], false);
    const long = ScoreSystem.scoreSelection(session, [2, 3, 3, 5], false);
    expect(single.gained).toBe(100);
    expect(long.gained).toBe(500);
    expect(long.labels).toContain("긴 연결 보너스");
  });

  it("scores obstacle and special clears", () => {
    const obstacle = ScoreSystem.scoreObstacleHits(2, 1);
    expect(obstacle.gained).toBe(0);
    expect(obstacle.parts.obstacle).toBe(obstacle.gained);
    const special = ScoreSystem.scoreSpecialClears(3);
    expect(special.gained).toBe(0);
    expect(special.labels).toEqual([]);
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

  it("only suggests adjacent candies for ordered connection hints", () => {
    const board: Board = [
      [
        { id: "a", prime: 2, row: 0, col: 0 },
        { id: "b", prime: 5, row: 0, col: 1 },
        { id: "c", prime: 2, row: 0, col: 2 },
      ],
      [null, null, null],
      [
        { id: "d", prime: 3, row: 2, col: 0 },
        { id: "e", prime: 2, row: 2, col: 1 },
        null,
      ],
    ];
    const hint = HintSystem.createHint(board, 12, 2);
    expect(hint.candies.map((candy) => candy.id)).toEqual(["d", "e"]);
  });

  it("calculates stars from configured thresholds", () => {
    expect(ScoreSystem.stars(100, [200, 400, 600])).toBe(0);
    expect(ScoreSystem.stars(400, [200, 400, 600])).toBe(2);
    expect(ScoreSystem.stars(700, [200, 400, 600])).toBe(3);
  });
});
