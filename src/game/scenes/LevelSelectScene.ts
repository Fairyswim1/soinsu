import { levels } from "../config/levels";
import { SaveManager } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

export class LevelSelectScene extends BaseScene {
  constructor() {
    super("LevelSelectScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("스테이지 선택", 58);
    this.add
      .text(640, 102, "목표 숫자를 소수 타일로 분해하며 다음 스테이지를 열어 보세요.", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        color: "#bdefff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const save = SaveManager.load();
    const startX = 210;
    const startY = 158;
    const gapX = 150;
    const gapY = 104;

    for (const level of levels) {
      const index = level.id - 1;
      const x = startX + (index % 5) * gapX;
      const y = startY + Math.floor(index / 5) * gapY;
      const unlocked = level.id <= save.unlockedLevel;
      const stars = save.levelStars[String(level.id)] ?? 0;
      const label = unlocked ? `${level.id}. ${level.title}` : `잠금 ${level.id}`;
      const button = this.addButton(
        x,
        y,
        label,
        () => {
          if (unlocked) this.scene.start("GameScene", { mode: "campaign", levelId: level.id });
        },
        132,
      );
      button.setAlpha(unlocked ? 1 : 0.45);
      this.add
        .text(x, y + 44, "★".repeat(stars) + "☆".repeat(3 - stars), {
          fontFamily: "Arial, sans-serif",
          fontSize: "20px",
          color: "#ffd761",
          stroke: "#081236",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
    }

    this.addButton(1040, 640, "타이틀", () => this.scene.start("MenuScene"), 170);
  }
}
