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
      "3. 1이 되면 완료! 순서가 달라도 정규형(12=2²×3)은 같아요.",
      "4. 합성수 얼음은 옆에서 소수로 나눠 분해해요.",
      "5. 특수 사탕 제거는 보드만 치우고 소인수에는 안 넣어요.",
    ];
    this.addPanel(640, 340, 900, 340);
    lines.forEach((line, index) => {
      this.add
        .text(250, 220 + index * 48, line, {
          fontFamily: "Arial, sans-serif",
          fontSize: "24px",
          color: "#ffffff",
        })
        .setOrigin(0, 0.5);
    });
    this.addButton(520, 560, "직접 해보기", () => this.scene.start("GameScene", { mode: "tutorial", levelId: 1 }), 220);
    this.addButton(760, 560, "건너뛰기", () => this.scene.start("MenuScene"), 220);
  }
}
