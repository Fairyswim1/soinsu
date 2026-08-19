import { describe, expect, it } from "vitest";
import { levels } from "../game/config/levels";
import { LevelManager } from "../game/systems/LevelManager";
import { FactorizationEngine } from "../game/systems/FactorizationEngine";

describe("LevelManager", () => {
  it("generates targets from level rules instead of relying on fixed target lists", () => {
    for (const baseLevel of levels) {
      const level = LevelManager.getLevel(baseLevel.id);
      const rules = level.targetRules;
      expect(rules).toBeTruthy();
      expect(level.targets).toHaveLength(rules!.targetCount);

      for (const target of level.targets) {
        const digits = String(target).length;
        expect(digits).toBeGreaterThanOrEqual(rules!.digitRange[0]);
        expect(digits).toBeLessThanOrEqual(rules!.digitRange[1]);

        const counts = FactorizationEngine.factorize(target);
        const factorCount = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
        expect(factorCount).toBeGreaterThanOrEqual(rules!.factorCountRange[0]);
        expect(factorCount).toBeLessThanOrEqual(rules!.factorCountRange[1]);

        for (const prime of Object.keys(counts)) {
          expect(level.availablePrimes).toContain(Number(prime));
        }
      }
    }
  });
});
