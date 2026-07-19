import { SaveManager } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

export class MenuScene extends BaseScene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("Prime Pop: Factor Candy Lab", 92);
    this.add
      .text(640, 154, "소수 사탕을 연결해 목표 수를 1까지 나누세요.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        color: "#dfe8ff",
      })
      .setOrigin(0.5);
    this.addButton(640, 250, "캠페인 시작", () => this.scene.start("LevelSelectScene"), 300);
    this.addButton(640, 330, "튜토리얼", () => this.scene.start("TutorialScene"), 300);
    this.addButton(640, 410, "빠른 연습", () => this.scene.start("QuickPracticeScene"), 300);
    this.addButton(640, 490, "교실 모드", () => this.scene.start("ClassroomScene"), 300);
    this.addButton(640, 570, "설정", () => this.scene.start("SettingsScene"), 300);
    SaveManager.update((data) => ({ ...data, lastMode: "campaign" }));
  }
}
