import type { Prime } from "../models/CandyModel";

export type PrimeTheme = {
  color: number;
  dark: number;
  highlight: number;
  shape: "circle" | "roundRect" | "drop" | "star" | "hex";
  label: string;
};

export const primeThemes: Record<Prime, PrimeTheme> = {
  2: { color: 0x4fd6ff, dark: 0x147aa7, highlight: 0xd8f7ff, shape: "circle", label: "구슬" },
  3: { color: 0xff7bc8, dark: 0xa91f6d, highlight: 0xffd9ef, shape: "roundRect", label: "젤리" },
  5: { color: 0xffd761, dark: 0xb07300, highlight: 0xfff2c2, shape: "drop", label: "물방울" },
  7: { color: 0x8dfa72, dark: 0x2b8b35, highlight: 0xe4ffda, shape: "star", label: "별" },
  11: { color: 0xbda2ff, dark: 0x6042b8, highlight: 0xeee8ff, shape: "hex", label: "보석" },
};

export const uiTheme = {
  panel: 0x222958,
  panelLight: 0x313b78,
  ink: "#ffffff",
  mutedInk: "#cbd4ff",
  accent: 0x5be0ff,
  warn: 0xffcf5a,
  danger: 0xff6c83,
};
