import { describe, expect, it } from "vitest";
import { BlockerSystem } from "../game/systems/BlockerSystem";

describe("BlockerSystem", () => {
  it("updates composite ice with valid prime hits", () => {
    const blockers = BlockerSystem.createBlockers([{ type: "compositeIce", row: 1, col: 1, value: 12 }]);
    BlockerSystem.hitAdjacent(blockers, 1, 0, 2);
    expect(blockers[0]).toMatchObject({ current: 6 });
    BlockerSystem.hitAdjacent(blockers, 0, 1, 2);
    BlockerSystem.hitAdjacent(blockers, 1, 2, 3);
    expect(blockers[0]).toMatchObject({ current: 1, factorsUsed: [2, 2, 3] });
  });

  it("tracks repeated prime requirements for locks", () => {
    const blockers = BlockerSystem.createBlockers([{ type: "primeLock", row: 2, col: 2, value: 12 }]);
    BlockerSystem.hitAdjacent(blockers, 2, 1, 2);
    let result = BlockerSystem.hitAdjacent(blockers, 1, 2, 3);
    expect(result.cleared).toHaveLength(0);
    result = BlockerSystem.hitAdjacent(blockers, 3, 2, 2);
    expect(result.cleared).toHaveLength(1);
  });
});
