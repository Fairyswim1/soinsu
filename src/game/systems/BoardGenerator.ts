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
  validDensityLimit?: number;
  adjacentValidSuppression?: number;
};

let candyCounter = 0;

export class BoardGenerator {
  private readonly rows: number;
  private readonly columns: number;
  private readonly primes: Prime[];
  private readonly random: SeededRandom;
  private readonly validDensityLimit: number;
  private readonly adjacentValidSuppression: number;
  shuffleCount = 0;

  constructor(options: BoardGeneratorOptions) {
    this.rows = options.rows ?? gameConfig.board.rows;
    this.columns = options.columns ?? gameConfig.board.columns;
    this.primes = [...options.availablePrimes];
    this.random = new SeededRandom(options.seed);
    this.validDensityLimit = options.validDensityLimit ?? 0.34;
    this.adjacentValidSuppression = options.adjacentValidSuppression ?? 0.7;
  }

  createBoard(remainder: number): Board {
    const board: Board = Array.from({ length: this.rows }, () => Array.from({ length: this.columns }, () => null));
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        board[row]![col] = this.createCandy(row, col, this.pickPrimeForCell(board, row, col, remainder));
      }
    }
    this.ensureFactorChain(board, remainder);
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
    this.ensureFactorChain(board, remainder);
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

  hasFactorChain(board: Board, remainder: number): boolean {
    const factors = this.expandedFactorsFor(remainder);
    if (factors.length === 0) return false;
    const totalFactors = factors.length;
    const factorCounts = factors.reduce<Partial<Record<Prime, number>>>((counts, factor) => {
      counts[factor] = (counts[factor] ?? 0) + 1;
      return counts;
    }, {});

    const visit = (
      row: number,
      col: number,
      currentRemainder: number,
      remainingCounts: Partial<Record<Prime, number>>,
      visited: Set<string>,
      depth: number,
    ): boolean => {
      const cell = board[row]?.[col] ?? null;
      if (!cell || visited.has(cell.id)) return false;
      const remaining = remainingCounts[cell.prime] ?? 0;
      if (remaining <= 0 || !FactorizationEngine.canDivide(currentRemainder, cell.prime)) return false;
      if (depth === totalFactors) return true;
      const nextCounts = { ...remainingCounts, [cell.prime]: remaining - 1 };
      const nextRemainder = currentRemainder / cell.prime;
      visited.add(cell.id);
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          if (rowOffset === 0 && colOffset === 0) continue;
          const next = board[row + rowOffset]?.[col + colOffset] ?? null;
          if (!next || visited.has(next.id)) continue;
          if (visit(row + rowOffset, col + colOffset, nextRemainder, nextCounts, new Set(visited), depth + 1)) return true;
        }
      }
      return false;
    };

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.columns; col += 1) {
        if (visit(row, col, remainder, factorCounts, new Set(), 1)) return true;
      }
    }
    return false;
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

  private ensureFactorChain(board: Board, remainder: number): void {
    const factors = this.expandedFactorsFor(remainder);
    if (factors.length === 0 || factors.length > this.rows * this.columns || this.hasFactorChain(board, remainder)) return;

    const coordinates = this.chainCoordinates(factors.length);
    const shuffledFactors = this.shuffleFactors(factors);
    shuffledFactors.forEach((factor, index) => {
      const coordinate = coordinates[index];
      if (!coordinate) return;
      board[coordinate.row]![coordinate.col] = this.createCandy(coordinate.row, coordinate.col, factor);
    });
  }

  private expandedFactorsFor(remainder: number): Prime[] {
    const counts = FactorizationEngine.factorize(remainder);
    const factors = supportedPrimes.flatMap((prime) => Array.from({ length: counts[prime] ?? 0 }, () => prime));
    return factors.every((factor) => this.primes.includes(factor)) ? factors : [];
  }

  private shuffleFactors(factors: readonly Prime[]): Prime[] {
    const shuffled = [...factors];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = this.random.integer(index + 1);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
    }
    return shuffled;
  }

  private chainCoordinates(length: number): Array<{ row: number; col: number }> {
    const coordinates: Array<{ row: number; col: number }> = [];
    const row = this.random.integer(this.rows);
    const startCol = length <= this.columns ? this.random.integer(this.columns - length + 1) : 0;

    if (length <= this.columns) {
      for (let index = 0; index < length; index += 1) {
        coordinates.push({ row, col: startCol + index });
      }
      return coordinates;
    }

    for (let rowIndex = 0; rowIndex < this.rows && coordinates.length < length; rowIndex += 1) {
      const leftToRight = rowIndex % 2 === 0;
      for (let colIndex = 0; colIndex < this.columns && coordinates.length < length; colIndex += 1) {
        coordinates.push({ row: rowIndex, col: leftToRight ? colIndex : this.columns - 1 - colIndex });
      }
    }
    return coordinates;
  }

  private pickPrimeForCell(board: Board, row: number, col: number, remainder: number): Prime {
    const validPrimes = FactorizationEngine.validPrimesFor(remainder, this.primes);
    const invalidPrimes = this.primes.filter((prime) => !validPrimes.includes(prime));
    const validCount = board
      .flat()
      .filter((cell) => Boolean(cell && FactorizationEngine.canDivide(remainder, cell.prime))).length;
    const validDensityTooHigh = validCount >= Math.ceil(this.rows * this.columns * this.validDensityLimit);
    const adjacentValidCount = this.countAdjacentValid(board, row, col, remainder);
    if (
      invalidPrimes.length > 0 &&
      (validDensityTooHigh || (adjacentValidCount > 0 && this.random.next() < this.adjacentValidSuppression))
    ) {
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
