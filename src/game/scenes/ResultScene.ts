import { levels } from "../config/levels";
import { PRIME_POP_SCREEN_ASSETS } from "../config/primePopAssets";
import type { GameSession } from "../models/GameSession";
import { FactorizationEngine } from "../systems/FactorizationEngine";
import { SaveManager } from "../systems/SaveManager";
import { ScoreSystem } from "../systems/ScoreSystem";
import { BaseScene } from "./BaseScene";

export class ResultScene extends BaseScene {
  constructor() {
    super("ResultScene");
  }

  create(data: { session: GameSession }): void {
    this.addBackground();
    const session = data.session;
    const stars = session.cleared ? ScoreSystem.stars(session.score, session.level.starThresholds) : 0;
    this.saveResult(session, stars);

    if (session.cleared) {
      this.drawClearPopup(session, stars);
    } else {
      this.drawRetryPopup(session);
    }
  }

  private saveResult(session: GameSession, stars: number): void {
    if (session.mode !== "campaign" || !session.cleared) return;
    SaveManager.update((save) => ({
      ...save,
      tutorialComplete: save.tutorialComplete || session.level.id === 1,
      unlockedLevel: Math.max(save.unlockedLevel, Math.min(levels.length, session.level.id + 1)),
      levelScores: {
        ...save.levelScores,
        [session.level.id]: Math.max(save.levelScores[String(session.level.id)] ?? 0, session.score),
      },
      levelStars: {
        ...save.levelStars,
        [session.level.id]: Math.max(save.levelStars[String(session.level.id)] ?? 0, stars),
      },
    }));
  }

  private drawClearPopup(session: GameSession, stars: number): void {
    this.addPopupImage(PRIME_POP_SCREEN_ASSETS.stageClearPopup.key, 640, 360, 570, 570);
    const equations = this.completedEquations(session);
    this.add
      .text(640, 285, "스테이지 클리어!", {
        fontFamily: "Arial, sans-serif",
        fontSize: "42px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 338, "분해 성공!", {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#bff7ff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 405, `점수 ${session.score}   ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        color: "#ffd761",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 456, equations, {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);
    this.addHotspot(640, 560, 230, 76, () => this.goNext(session));
  }

  private drawRetryPopup(session: GameSession): void {
    this.addPopupImage(PRIME_POP_SCREEN_ASSETS.retryPopup.key, 640, 360, 620, 414);
    const target = session.currentRemainder > 1 ? session.currentRemainder : session.originalTarget;

    const mask = this.add.graphics();
    mask.fillStyle(0x142a75, 0.92);
    mask.fillEllipse(640, 221, 118, 82);
    mask.lineStyle(3, 0x7ff3ff, 0.65);
    mask.strokeEllipse(640, 221, 118, 82);

    this.add
      .text(640, 221, String(target), {
        fontFamily: "Arial, sans-serif",
        fontSize: target >= 100 ? "42px" : "50px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#071236",
        strokeThickness: 7,
        shadow: { offsetX: 0, offsetY: 3, color: "#22d8ff", blur: 10, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(640, 345, "다시 도전해 볼까요?", {
        fontFamily: "Arial, sans-serif",
        fontSize: "34px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 395, `완성한 목표 ${session.completedFactorizations.length}/${session.level.targets.length}  점수 ${session.score}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#bff7ff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.addHotspot(540, 535, 210, 72, () => this.scene.start("GameScene", { mode: session.mode, level: session.level }));
    this.addHotspot(746, 535, 238, 72, () => this.scene.start("LevelSelectScene"));
  }

  private addPopupImage(key: string, x: number, y: number, width: number, height: number): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, key);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const scale = Math.min(width / source.width, height / source.height);
    image.setScale(scale);
    return image;
  }

  private addHotspot(x: number, y: number, width: number, height: number, onClick: () => void): Phaser.GameObjects.Rectangle {
    const hotspot = this.add.rectangle(x, y, width, height, 0xffffff, 0.001);
    hotspot.setInteractive({ useHandCursor: true });
    hotspot.on("pointerdown", () => {
      this.tweens.add({ targets: hotspot, scale: 0.96, duration: 70, yoyo: true });
      onClick();
    });
    return hotspot;
  }

  private goNext(session: GameSession): void {
    const nextLevel = levels.find((level) => level.id === session.level.id + 1);
    if (session.mode === "campaign" && nextLevel) {
      this.scene.start("GameScene", { mode: session.mode, levelId: nextLevel.id });
      return;
    }
    this.scene.start("LevelSelectScene");
  }

  private completedEquations(session: GameSession): string {
    if (session.completedFactorizations.length === 0) {
      return FactorizationEngine.formatEquation(session.originalTarget, session.selectedFactors);
    }
    return session.completedFactorizations.map((item) => `${item.target} = ${item.canonical}`).join("\n");
  }
}
