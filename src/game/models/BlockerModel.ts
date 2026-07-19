import type { Prime } from "./CandyModel";

export type CompositeIce = {
  id: string;
  type: "compositeIce";
  row: number;
  col: number;
  current: number;
  original: number;
  factorsUsed: Prime[];
};

export type PrimeLock = {
  id: string;
  type: "primeLock";
  row: number;
  col: number;
  required: Partial<Record<Prime, number>>;
  used: Partial<Record<Prime, number>>;
};

export type Blocker = CompositeIce | PrimeLock;

export type BlockerConfig =
  | { type: "compositeIce"; row: number; col: number; value: number }
  | { type: "primeLock"; row: number; col: number; value: number };
