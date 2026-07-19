import { BaseScene } from "./BaseScene";

export class TutorialScene extends BaseScene {
  constructor() {
    super("TutorialScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("튜토리얼", 72);
    const lines = [
      "1. 목표 수를 나눌 수 있는 소수 사탕을 찾아요.",
      "2. 이웃한 사탕을 드래그해 12 ÷ 2 = 6처럼 나눠요.",
      "3. 6 → 3 → 1이 되면 소인수분해 완료!",
      "4. 결과는 12 = 2² × 3처럼 지수로 정리돼요.",
    ];
    this.addPanel(640, 340, 840, 300);
    lines.forEach((line, index) => {
      this.add
        .text(270, 240 + index * 54, line, {
          fontFamily: "Arial, sans-serif",
          fontSize: "26px",
          color: "#ffffff",
        })
        .setOrigin(0, 0.5);
    });
    this.addButton(520, 560, "직접 해보기", () => this.scene.start("GameScene", { mode: "tutorial", levelId: 1 }), 220);
    this.addButton(760, 560, "건너뛰기", () => this.scene.start("MenuScene"), 220);
  }
}
