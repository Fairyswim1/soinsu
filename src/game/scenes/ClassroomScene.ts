import { gameConfig } from "../config/gameConfig";
import { PRIME_POP_BATTLE_ASSETS } from "../config/primePopAssets";
import { gameFontFamily } from "../config/theme";
import type { ClassroomState } from "../models/GameSession";
import { BaseScene } from "./BaseScene";

type ClassroomSceneData = {
  classroomState?: ClassroomState;
};

type SourcePoint = {
  x: number;
  y: number;
};

type SourceFrame = SourcePoint & {
  width: number;
};

type ScaledBackground = {
  left: number;
  top: number;
  scale: number;
};

const DEFAULT_CLASSROOM_STATE: ClassroomState = {
  teams: ["A팀", "B팀"],
  scores: [0, 0],
  currentTeamIndex: 0,
  round: 1,
};

const createDefaultClassroomState = (): ClassroomState => ({
  teams: [...DEFAULT_CLASSROOM_STATE.teams],
  scores: [...DEFAULT_CLASSROOM_STATE.scores],
  currentTeamIndex: DEFAULT_CLASSROOM_STATE.currentTeamIndex,
  round: DEFAULT_CLASSROOM_STATE.round,
});

export class ClassroomScene extends BaseScene {
  private state: ClassroomState = createDefaultClassroomState();

  constructor() {
    super("ClassroomScene");
  }

  create(data: ClassroomSceneData): void {
    this.state = this.normalizeState(data.classroomState);
    const background = this.addBattleBackground();

    this.addScoreText({ x: 350, y: 385 }, background, 0);
    this.addScoreText({ x: 1322, y: 385 }, background, 1);
    this.addRoundText({ x: 836, y: 780 }, background);

    this.addImageButton({ x: 465, y: 876, width: 338 }, background, PRIME_POP_BATTLE_ASSETS.stageSelect.key, () => this.selectStage());
    this.addImageButton({ x: 836, y: 876, width: 338 }, background, PRIME_POP_BATTLE_ASSETS.resetScore.key, () => this.resetScore());
    this.addImageButton({ x: 1207, y: 876, width: 338 }, background, PRIME_POP_BATTLE_ASSETS.title.key, () => this.scene.start("MenuScene"));
  }

  private normalizeState(state?: ClassroomState): ClassroomState {
    if (!state) {
      return createDefaultClassroomState();
    }
    const teams = state.teams.length >= 2 ? state.teams.slice(0, 2) : [...DEFAULT_CLASSROOM_STATE.teams];
    const scores = teams.map((_, index) => Math.max(0, state.scores[index] ?? 0));
    return {
      teams,
      scores,
      currentTeamIndex: Math.max(0, Math.min(teams.length - 1, state.currentTeamIndex)),
      round: Math.max(1, state.round),
    };
  }

  private addBattleBackground(): ScaledBackground {
    const key = PRIME_POP_BATTLE_ASSETS.background.key;
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const scale = Math.max(gameConfig.width / source.width, gameConfig.height / source.height);
    const displayWidth = source.width * scale;
    const displayHeight = source.height * scale;
    const left = gameConfig.width / 2 - displayWidth / 2;
    const top = gameConfig.height / 2 - displayHeight / 2;

    this.add.image(gameConfig.width / 2, gameConfig.height / 2, key).setDisplaySize(displayWidth, displayHeight);
    return { left, top, scale };
  }

  private addScoreText(point: SourcePoint, background: ScaledBackground, teamIndex: number): void {
    const isCurrent = teamIndex === this.state.currentTeamIndex;
    const glow = teamIndex === 0 ? "#ffd761" : "#8fe8ff";
    const text = this.add
      .text(background.left + point.x * background.scale, background.top + point.y * background.scale, String(this.state.scores[teamIndex] ?? 0), {
        fontFamily: gameFontFamily,
        fontSize: `${Math.round(86 * background.scale)}px`,
        color: "#fff8e8",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: Math.max(6, Math.round(9 * background.scale)),
        shadow: { offsetX: 0, offsetY: 0, color: glow, blur: 18, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(10);

    if (isCurrent) {
      this.tweens.add({ targets: text, scale: 1.04, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private addRoundText(point: SourcePoint, background: ScaledBackground): void {
    const text = `${this.state.round}라운드`;
    this.add
      .text(background.left + point.x * background.scale, background.top + point.y * background.scale, text, {
        fontFamily: gameFontFamily,
        fontSize: `${Math.round(54 * background.scale)}px`,
        color: "#fff8d8",
        fontStyle: "bold",
        stroke: "#15206a",
        strokeThickness: Math.max(6, Math.round(9 * background.scale)),
        shadow: { offsetX: 0, offsetY: 3, color: "#ffd761", blur: 10, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(10);
  }

  private addImageButton(sourceFrame: SourceFrame, background: ScaledBackground, key: string, onClick: () => void): void {
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const x = background.left + sourceFrame.x * background.scale;
    const y = background.top + sourceFrame.y * background.scale;
    const width = sourceFrame.width * background.scale;
    const scale = width / source.width;
    const height = source.height * scale;
    const image = this.add.image(x, y, key).setScale(scale).setDepth(12);
    const hotspot = this.add.zone(x, y, width, height).setDepth(20);

    hotspot.setInteractive({ useHandCursor: true });
    hotspot.on("pointerover", () => this.tweens.add({ targets: image, scale: scale * 1.02, duration: 90, ease: "Sine.easeOut" }));
    hotspot.on("pointerout", () => this.tweens.add({ targets: image, scale, duration: 90, ease: "Sine.easeOut" }));
    hotspot.on("pointerdown", () => {
      this.tweens.add({ targets: image, scale: scale * 0.96, duration: 80, yoyo: true, ease: "Sine.easeOut" });
    });
    hotspot.on("pointerup", () => {
      image.setScale(scale);
      onClick();
    });
  }

  private selectStage(): void {
    this.scene.start("LevelSelectScene", {
      mode: "classroom",
      classroomState: this.state,
    });
  }

  private resetScore(): void {
    this.scene.restart({ classroomState: createDefaultClassroomState() });
  }
}
