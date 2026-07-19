import { gameConfig } from "../config/gameConfig";

export type SaveData = {
  version: 1;
  tutorialComplete: boolean;
  unlockedLevel: number;
  levelScores: Record<string, number>;
  levelStars: Record<string, number>;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  lastMode: "campaign" | "quick" | "classroom";
};

const defaultSave: SaveData = {
  version: 1,
  tutorialComplete: false,
  unlockedLevel: 1,
  levelScores: {},
  levelStars: {},
  muted: false,
  musicVolume: 0.35,
  sfxVolume: 0.7,
  reducedMotion: false,
  lastMode: "campaign",
};

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(gameConfig.saveKey);
      if (!raw) return { ...defaultSave };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (parsed.version !== 1) return { ...defaultSave };
      return { ...defaultSave, ...parsed };
    } catch {
      return { ...defaultSave };
    }
  }

  static save(data: SaveData): void {
    localStorage.setItem(gameConfig.saveKey, JSON.stringify(data));
  }

  static update(mutator: (data: SaveData) => SaveData): SaveData {
    const next = mutator(this.load());
    this.save(next);
    return next;
  }

  static reset(): void {
    localStorage.removeItem(gameConfig.saveKey);
  }
}
