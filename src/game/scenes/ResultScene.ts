import { levels } from "../config/levels";
import { PRIME_POP_SCREEN_ASSETS } from "../config/primePopAssets";
import { gameFontFamily } from "../config/theme";
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

    if (session.mode === "classroom") {
      this.drawClassroomResult(session);
      return;
    }

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
      .text(640, 405, `점수 ${session.score}   ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, {
        fontFamily: gameFontFamily,
        fontSize: "26px",
        color: "#ffd761",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 456, equations, {
        fontFamily: gameFontFamily,
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);
    this.addHotspot(640, 550, 270, 86, () => this.goNext(session));
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
        fontFamily: gameFontFamily,
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
        fontFamily: gameFontFamily,
        fontSize: "34px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 395, `완성한 목표 ${session.completedFactorizations.length}/${session.level.targets.length}  점수 ${session.score}`, {
        fontFamily: gameFontFamily,
        fontSize: "22px",
        color: "#bff7ff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.addHotspot(522, 494, 250, 86, () => this.scene.start("GameScene", { mode: session.mode, level: session.level }));
    this.addHotspot(760, 494, 294, 86, () => this.scene.start("LevelSelectScene"));
  }

  private drawClassroomResult(session: GameSession): void {
    const nextState = this.nextClassroomState(session);
    this.addPanel(640, 420, 760, 420);
    this.add
      .text(640, 270, "교실 대결 결과", {
        fontFamily: gameFontFamily,
        fontSize: "46px",
        color: "#fff4a8",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 370, `이번 점수 ${session.score}`, {
        fontFamily: gameFontFamily,
        fontSize: "42px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 470, `${nextState.teams[0]} ${nextState.scores[0]}점   ${nextState.teams[1]} ${nextState.scores[1]}점`, {
        fontFamily: gameFontFamily,
        fontSize: "32px",
        color: "#dffbff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.addButton(480, 620, "다음 팀 맵 선택", () => this.scene.start("LevelSelectScene", { mode: "classroom", classroomState: nextState }), 280);
    this.addButton(780, 620, "타이틀", () => this.scene.start("MenuScene"), 220);
  }

  private nextClassroomState(session: GameSession): NonNullable<GameSession["classroomState"]> {
    const current = session.classroomState ?? {
      teams: ["A팀", "B팀"],
      scores: [0, 0],
      currentTeamIndex: 0,
      round: 1,
    };
    const teams = current.teams.slice(0, 2);
    const scores = teams.map((_, index) => current.scores[index] ?? 0);
    return {
      teams,
      scores,
      currentTeamIndex: current.currentTeamIndex,
      round: current.round,
    };
  }

  private addPopupImage(key: string, x: number, y: number, width: number, height: number): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, key);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const scale = Math.min(width / source.width, height / source.height);
    image.setScale(scale);
    return image;
  }

  private addHotspot(x: number, y: number, width: number, height: number, onClick: () => void): Phaser.GameObjects.Zone {
    const hotspot = this.add.zone(x, y, width, height).setDepth(100);
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
