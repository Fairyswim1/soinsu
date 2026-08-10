import { BaseScene } from "./BaseScene";

export class TutorialScene extends BaseScene {
  constructor() {
    super("TutorialScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("게임 방법", 78);
    this.addPanel(640, 342, 880, 360);

    const lines = [
      "1. 목표 숫자를 확인한다",
      "2. 소수 타일을 손가락으로 연결한다",
      "3. 올바른 곱으로 목표 숫자를 만든다",
      "4. 정답이면 타일이 터지고 다음 목표로 넘어간다",
    ];

    lines.forEach((line, index) => {
      this.add
        .text(265, 230 + index * 64, line, {
          fontFamily: "Arial, sans-serif",
          fontSize: "28px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#081236",
          strokeThickness: 5,
        })
        .setOrigin(0, 0.5);
    });

    this.addButton(520, 590, "바로 시작", () => this.scene.start("GameScene", { mode: "tutorial", levelId: 1 }), 220);
    this.addButton(760, 590, "타이틀", () => this.scene.start("MenuScene"), 220);
  }
}
