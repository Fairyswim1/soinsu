import { gameConfig } from "../config/gameConfig";
import type { Board, Candy, Prime } from "../models/CandyModel";
import { supportedPrimes } from "../models/CandyModel";
import { SeededRandom } from "../utils/random";
import { FactorizationEngine } from "./FactorizationEngine";

export type BoardGeneratorOptions = {
  rows?: number;
  columns?: number;
  availablePrimes: Prime[];
  seed?: number;
};

let candyCounter = 0;

export class BoardGenerator {
  private readonly rows: number;
  private readonly columns: number;
  private readonly primes: Prime[];
  private readonly random: SeededRandom;
  shuffleCount = 0;

  constructor(options: BoardGeneratorOptions) {
    this.rows = options.rows ?? gameConfig.board.rows;
    this.columns = options.columns ?? gameConfig.board.columns;
    this.primes = [...options.availablePrimes];
    this.random = new SeededRandom(options.seed);
  }

  createBoard(remainder: number): Board {
    const board: Board = Array.from({ length: this.rows }, () => Array.from({ length: this.columns }, () => null));
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        board[row]![col] = this.createCandy(row, col, this.pickPrimeForCell(board, row, col, remainder));
      }
    }
    this.ensureValidMove(board, remainder);
    return board;
  }

  refill(board: Board, remainder: number): Board {
    for (let col = 0; col < this.columns; col += 1) {
      const existing: Candy[] = [];
      for (let row = this.rows - 1; row >= 0; row -= 1) {
        const cell = board[row]?.[col] ?? null;
        if (cell) existing.push(cell);
      }
      for (let row = this.rows - 1; row >= 0; row -= 1) {
        const candy = existing.shift() ?? this.createCandy(row, col, this.pickPrimeForCell(board, row, col, remainder));
        candy.row = row;
        candy.col = col;
        board[row]![col] = candy;
      }
    }
    this.ensureValidMove(board, remainder);
    return board;
  }

  remove(board: Board, ids: readonly string[]): Board {
    const idSet = new Set(ids);
    for (const row of board) {
      for (let col = 0; col < row.length; col += 1) {
        if (row[col] && idSet.has(row[col]!.id)) {
          row[col] = null;
        }
      }
    }
    return board;
  }

  hasValidMove(board: Board, remainder: number): boolean {
    return board.some((row) =>
      row.some((cell) => Boolean(cell && FactorizationEngine.canDivide(remainder, cell.prime))),
    );
  }

  ensureValidMove(board: Board, remainder: number): void {
    if (this.hasValidMove(board, remainder)) {
      return;
    }
    this.shuffleCount += 1;
    const valid = FactorizationEngine.validPrimesFor(remainder, this.primes);
    const fallbackValid = FactorizationEngine.validPrimesFor(remainder, supportedPrimes);
    const replacement = valid[0] ?? fallbackValid[0] ?? this.primes[0] ?? 2;
    board[0]![0] = this.createCandy(0, 0, replacement);
  }

  createCandy(row: number, col: number, forcedPrime?: Prime): Candy {
    const prime = forcedPrime ?? this.random.pick(this.primes);
    candyCounter += 1;
    return {
      id: `candy-${candyCounter}`,
      prime,
      row,
      col,
    };
  }

  private pickPrimeForCell(board: Board, row: number, col: number, remainder: number): Prime {
    const validPrimes = FactorizationEngine.validPrimesFor(remainder, this.primes);
    const invalidPrimes = this.primes.filter((prime) => !validPrimes.includes(prime));
    const validCount = board
      .flat()
      .filter((cell) => Boolean(cell && FactorizationEngine.canDivide(remainder, cell.prime))).length;
    const validDensityTooHigh = validCount >= Math.ceil(this.rows * this.columns * 0.34);
    const adjacentValidCount = this.countAdjacentValid(board, row, col, remainder);
    if (invalidPrimes.length > 0 && (validDensityTooHigh || (adjacentValidCount > 0 && this.random.next() < 0.7))) {
      return this.random.pick(invalidPrimes);
    }
    return this.random.pick(this.primes);
  }

  private countAdjacentValid(board: Board, row: number, col: number, remainder: number): number {
    let count = 0;
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        if (rowOffset === 0 && colOffset === 0) continue;
        const cell = board[row + rowOffset]?.[col + colOffset] ?? null;
        if (cell && FactorizationEngine.canDivide(remainder, cell.prime)) {
          count += 1;
        }
      }
    }
    return count;
  }
}
