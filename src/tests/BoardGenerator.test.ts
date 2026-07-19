import { describe, expect, it } from "vitest";
import { BoardGenerator } from "../game/systems/BoardGenerator";
import { SelectionSystem } from "../game/systems/SelectionSystem";

describe("BoardGenerator and SelectionSystem", () => {
  it("guarantees at least one valid move for the current remainder", () => {
    const generator = new BoardGenerator({ availablePrimes: [5, 7], seed: 42 });
    const board = generator.createBoard(18);
    expect(generator.hasValidMove(board, 18)).toBe(true);
    expect(generator.shuffleCount).toBeGreaterThan(0);
  });

  it("refills after removal while preserving a playable board", () => {
    const generator = new BoardGenerator({ availablePrimes: [2, 3, 5], seed: 7 });
    const board = generator.createBoard(45);
    const first = board[0]![0]!;
    generator.remove(board, [first.id]);
    generator.refill(board, 45);
    expect(board.flat().filter(Boolean)).toHaveLength(48);
    expect(generator.hasValidMove(board, 45)).toBe(true);
  });

  it("supports dragging back to undo the last selected cell", () => {
    const generator = new BoardGenerator({ availablePrimes: [2, 3, 5], seed: 1 });
    const board = generator.createBoard(30);
    board[0]![0] = { id: "a", prime: 2, row: 0, col: 0 };
    board[0]![1] = { id: "b", prime: 3, row: 0, col: 1 };
    const selection = new SelectionSystem(board);
    selection.tryAdd(0, 0, 30);
    selection.tryAdd(0, 1, 30);
    const state = selection.tryAdd(0, 0, 30);
    expect(state.factors).toEqual([2]);
  });

  it("rejects duplicate and non-adjacent cells", () => {
    const generator = new BoardGenerator({ availablePrimes: [2, 3, 5], seed: 3 });
    const board = generator.createBoard(30);
    board[0]![0] = { id: "a", prime: 2, row: 0, col: 0 };
    board[0]![1] = { id: "b", prime: 3, row: 0, col: 1 };
    board[5]![7] = { id: "c", prime: 5, row: 5, col: 7 };
    const selection = new SelectionSystem(board);
    selection.tryAdd(0, 0, 30);
    expect(selection.tryAdd(0, 0, 30).invalidMessage).toBeTruthy();
    expect(selection.tryAdd(5, 7, 30).invalidMessage).toBeTruthy();
  });
});
