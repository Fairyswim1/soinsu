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
    const stars = session.cleared ? ScoreSystem.stars(session.score, session.level.starThresholds) : 0;

    if (session.mode === "campaign" && session.cleared) {
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
            .map((item) => `${item.target} = ${item.canonical}`)
            .join(" / ")
        : FactorizationEngine.formatEquation(session.originalTarget, session.selectedFactors);
    const breakdownLines = ScoreSystem.formatBreakdown(session.scoreBreakdown);
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

    this.addTitle(session.cleared ? "클리어!" : "실패…", 78);
    this.addPanel(640, 335, 940, 430);
    const lines = [
      session.cleared
        ? `목표 ${session.level.targets.length}개 모두 소인수분해 완료`
        : `목표 ${session.completedFactorizations.length}/${session.level.targets.length}개 완료 — 다시 도전해 보세요`,
      `총점: ${session.score}`,
      `별: ${"★".repeat(stars)}${"☆".repeat(3 - stars)}${session.cleared ? "" : " (클리어 시에만 저장)"}`,
      `정확도: ${accuracy}%  |  힌트: ${session.hintsUsed}회  |  최장 연결: ${session.longestChain}`,
      `점수 내역: ${breakdownLines.join(" · ") || "-"}`,
      `미션: ${objectiveSummary}`,
      `완성식(정규형): ${completedEquations}`,
    ];
    lines.forEach((line, index) => {
      this.add
        .text(220, 168 + index * 42, line, {
          fontFamily: "Arial, sans-serif",
          fontSize: index === 4 || index === 6 ? "18px" : "24px",
          color: index === 0 ? (session.cleared ? "#8dfa72" : "#ff6c83") : index === 2 ? "#ffd761" : "#ffffff",
          wordWrap: { width: 820 },
        })
        .setOrigin(0, 0.5);
    });
    this.addButton(510, 610, "다시 하기", () => this.scene.start("GameScene", { mode: session.mode, level: session.level }), 220);
    this.addButton(770, 610, "메뉴", () => this.scene.start("MenuScene"), 220);
  }
}
