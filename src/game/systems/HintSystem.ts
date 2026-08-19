import type { Board, Candy, Prime } from "../models/CandyModel";
import { FactorizationEngine } from "./FactorizationEngine";

export type Hint = {
  level: 1 | 2 | 3;
  candies: Candy[];
  validPrimes: Prime[];
  message: string;
};

export class HintSystem {
  static createHint(board: Board, remainder: number, level: 1 | 2 | 3): Hint {
    const candidates = board.flat().filter((cell): cell is Candy =>
      Boolean(cell && FactorizationEngine.canDivide(remainder, cell.prime)),
    );
    const first = candidates[0];
    const validPrimes = [...new Set(candidates.map((candy) => candy.prime))];
    if (level === 1) {
      return {
        level,
        candies: first ? [first] : [],
        validPrimes,
        message: first ? `${first.prime} 사탕이 현재 수를 나눌 수 있어요.` : "보드를 섞을게요!",
      };
    }
    if (level === 2) {
      const chain = this.findAdjacentValidChain(board, remainder) ?? (first ? [first] : []);
      return {
        level,
        candies: chain,
        validPrimes,
        message: chain.length >= 2 ? "빛나는 순서대로 연결해 보세요." : "빛나는 보석부터 선택해 보세요.",
      };
    }
    return {
      level,
      candies: [],
      validPrimes,
      message: `현재 수 ${remainder}는 ${validPrimes.join(" 또는 ")}로 나눌 수 있어요.`,
    };
  }

  private static findAdjacentValidChain(board: Board, remainder: number): Candy[] | undefined {
    const candies = board.flat().filter((cell): cell is Candy => Boolean(cell));
    for (const first of candies) {
      for (const second of candies) {
        if (first.id === second.id || !this.areAdjacent(first, second)) continue;
        const result = FactorizationEngine.applyFactors(remainder, [first.prime, second.prime]);
        if (result.ok) return [first, second];
      }
    }
    return undefined;
  }

  private static areAdjacent(left: Candy, right: Candy): boolean {
    const rowDistance = Math.abs(left.row - right.row);
    const colDistance = Math.abs(left.col - right.col);
    return rowDistance <= 1 && colDistance <= 1 && rowDistance + colDistance > 0;
  }
}
