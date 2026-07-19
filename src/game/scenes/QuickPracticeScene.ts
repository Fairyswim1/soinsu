import { LevelManager } from "../systems/LevelManager";
import { BaseScene } from "./BaseScene";

export class QuickPracticeScene extends BaseScene {
  constructor() {
    super("QuickPracticeScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("빠른 연습", 78);
    this.addPanel(640, 330, 760, 300);
    this.add
      .text(640, 270, "목표: 36, 45, 72  |  소수: 2, 3, 5, 7  |  이동: 18", {
        fontFamily: "Arial, sans-serif",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add
      .text(640, 335, "교사가 바로 실행할 수 있는 기본 연습 설정입니다.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#cbd4ff",
      })
      .setOrigin(0.5);
    this.addButton(520, 455, "시작", () => this.scene.start("GameScene", { mode: "quick", level: LevelManager.quickPracticeLevel() }), 220);
    this.addButton(760, 455, "메뉴", () => this.scene.start("MenuScene"), 220);
  }
}
