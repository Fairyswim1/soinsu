import type { Blocker, BlockerConfig } from "../models/BlockerModel";
import type { Prime } from "../models/CandyModel";
import { FactorizationEngine } from "./FactorizationEngine";

export type BlockerHitResult = {
  damaged: Blocker[];
  cleared: Blocker[];
  messages: string[];
};

export class BlockerSystem {
  static createBlockers(configs: readonly BlockerConfig[]): Blocker[] {
    return configs.map((config, index) => {
      if (config.type === "compositeIce") {
        return {
          id: `ice-${index}`,
          type: "compositeIce",
          row: config.row,
          col: config.col,
          current: config.value,
          original: config.value,
          factorsUsed: [],
        };
      }
      return {
        id: `lock-${index}`,
        type: "primeLock",
        row: config.row,
        col: config.col,
        required: FactorizationEngine.factorize(config.value),
        used: {},
      };
    });
  }

  static hitAdjacent(blockers: Blocker[], row: number, col: number, prime: Prime): BlockerHitResult {
    const damaged: Blocker[] = [];
    const cleared: Blocker[] = [];
    const messages: string[] = [];
    for (const blocker of blockers) {
      const distance = Math.abs(blocker.row - row) + Math.abs(blocker.col - col);
      if (distance > 1) continue;
      if (blocker.type === "compositeIce") {
        if (FactorizationEngine.canDivide(blocker.current, prime)) {
          blocker.current /= prime;
          blocker.factorsUsed.push(prime);
          damaged.push(blocker);
          if (blocker.current === 1) {
            cleared.push(blocker);
            messages.push(`${blocker.original} = ${FactorizationEngine.formatFactors(blocker.factorsUsed)}`);
          }
        }
      } else {
        const need = blocker.required[prime] ?? 0;
        const used = blocker.used[prime] ?? 0;
        if (used < need) {
          blocker.used[prime] = used + 1;
          damaged.push(blocker);
          const done = Object.entries(blocker.required).every(([key, count]) => {
            const requiredPrime = Number(key) as Prime;
            return (blocker.used[requiredPrime] ?? 0) >= (count ?? 0);
          });
          if (done) cleared.push(blocker);
        }
      }
    }
    return { damaged, cleared, messages };
  }
}
