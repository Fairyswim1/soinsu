import type { Board, Candy, Prime } from "../models/CandyModel";
import { FactorizationEngine } from "./FactorizationEngine";

export type SelectionState = {
  candies: Candy[];
  factors: Prime[];
  previewRemainder: number;
  invalidMessage?: string;
};

export class SelectionSystem {
  private readonly selected: Candy[] = [];

  constructor(private readonly board: Board) {}

  clear(): void {
    this.selected.length = 0;
  }

  getState(startRemainder: number): SelectionState {
    const factors = this.selected.map((candy) => candy.prime);
    const result = FactorizationEngine.applyFactors(startRemainder, factors);
    return {
      candies: [...this.selected],
      factors,
      previewRemainder: result.ok ? result.remainder : result.remainder,
      invalidMessage: result.ok ? undefined : result.message,
    };
  }

  tryAdd(row: number, col: number, startRemainder: number): SelectionState {
    const candy = this.board[row]?.[col] ?? null;
    if (!candy) {
      return this.getState(startRemainder);
    }
    const last = this.selected.at(-1);
    const previous = this.selected.at(-2);
    if (previous?.id === candy.id) {
      this.selected.pop();
      return this.getState(startRemainder);
    }
    if (this.selected.some((item) => item.id === candy.id)) {
      return { ...this.getState(startRemainder), invalidMessage: "같은 사탕은 한 번만 연결해요." };
    }
    if (last && !SelectionSystem.areAdjacent(last, candy)) {
      return { ...this.getState(startRemainder), invalidMessage: "이웃한 사탕만 연결할 수 있어요." };
    }
    const trial = [...this.selected.map((item) => item.prime), candy.prime];
    const result = FactorizationEngine.applyFactors(startRemainder, trial);
    if (!result.ok) {
      return { ...this.getState(startRemainder), invalidMessage: result.message };
    }
    this.selected.push(candy);
    return this.getState(startRemainder);
  }

  static areAdjacent(left: Candy, right: Candy): boolean {
    const rowDistance = Math.abs(left.row - right.row);
    const colDistance = Math.abs(left.col - right.col);
    return rowDistance <= 1 && colDistance <= 1 && rowDistance + colDistance > 0;
  }
}
