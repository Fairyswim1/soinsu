import type { GameSession } from "../models/GameSession";
import { FactorizationEngine } from "../systems/FactorizationEngine";
import { levels } from "../config/levels";
import { ScoreSystem } from "../systems/ScoreSystem";
import { SaveManager } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

export class ResultScene extends BaseScene {
  constructor() {
    super("ResultScene");
  }

  create(data: { session: GameSession }): void {
    this.addBackground();
    const session = data.session;
    const stars = ScoreSystem.stars(session.score, session.level.starThresholds);
    if (session.mode === "campaign") {
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

    const accuracy = Math.round(
      (session.correctSelections / Math.max(1, session.correctSelections + session.invalidSelections)) * 100,
    );
    const completedEquations =
      session.completedFactorizations.length > 0
        ? session.completedFactorizations
            .map((item) => FactorizationEngine.formatEquation(item.target, item.factors))
            .join(" / ")
        : FactorizationEngine.formatEquation(session.originalTarget, session.selectedFactors);
    const objectiveSummary = [
      session.level.objectives.maxDragsPerTarget
        ? `${session.level.objectives.maxDragsPerTarget}드래그 이내 완료: ${session.targetsCompletedWithinDragGoal}/${session.level.targets.length}`
        : undefined,
      session.level.objectives.minLongChains
        ? `긴 연결: ${session.longChainsCompleted}/${session.level.objectives.minLongChains}`
        : undefined,
      session.objectiveBonusAwarded ? "미션 보너스 달성!" : "미션 보너스 미달성",
    ]
      .filter(Boolean)
      .join(" | ");

    this.addTitle("연구 결과", 78);
    this.addPanel(640, 335, 900, 410);
    const lines = [
      `총점: ${session.score}`,
      `별: ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`,
      `정확도: ${accuracy}%`,
      `힌트 사용: ${session.hintsUsed}회`,
      `남은 시간: ${Math.floor(session.timeLeftSeconds / 60)}:${String(session.timeLeftSeconds % 60).padStart(2, "0")}`,
      `가장 긴 연결: ${session.longestChain}`,
      `완성한 목표: ${session.completedFactorizations.length}개`,
      `미션: ${objectiveSummary}`,
      `완성식: ${completedEquations}`,
    ];
    lines.forEach((line, index) => {
      this.add
        .text(250, 180 + index * 40, line, {
          fontFamily: "Arial, sans-serif",
          fontSize: index >= 6 ? "21px" : "26px",
          color: index === 1 ? "#ffd761" : "#ffffff",
          wordWrap: { width: 780 },
        })
        .setOrigin(0, 0.5);
    });
    this.addButton(510, 610, "다시 하기", () => this.scene.start("GameScene", { mode: session.mode, level: session.level }), 220);
    this.addButton(770, 610, "메뉴", () => this.scene.start("MenuScene"), 220);
  }
}
