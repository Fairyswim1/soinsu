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
    const second = candidates.find((candy) => first && candy.id !== first.id);
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
      return {
        level,
        candies: [first, second].filter((candy): candy is Candy => Boolean(candy)),
        validPrimes,
        message: "빛나는 순서대로 연결해 보세요.",
      };
    }
    return {
      level,
      candies: [],
      validPrimes,
      message: `현재 수 ${remainder}는 ${validPrimes.join(" 또는 ")}로 나눌 수 있어요.`,
    };
  }
}
