export type Prime = 2 | 3 | 5 | 7 | 11 | 13 | 17;
export type SpecialCandy = "rocketH" | "rocketV" | "exponentBomb" | "rainbowPrime";

export type Candy = {
  id: string;
  prime: Prime;
  row: number;
  col: number;
  special?: SpecialCandy;
};

export type BoardCell = Candy | null;
export type Board = BoardCell[][];

export const supportedPrimes: Prime[] = [2, 3, 5, 7, 11, 13, 17];

export function isPrimeCandy(value: number): value is Prime {
  return supportedPrimes.includes(value as Prime);
}
