import { LevelManager } from "../systems/LevelManager";
import { BaseScene } from "./BaseScene";

export class ClassroomScene extends BaseScene {
  private teamIndex = 0;
  private readonly teams = ["A팀", "B팀", "C팀"];

  constructor() {
    super("ClassroomScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("교실 모드", 74);
    this.addPanel(640, 330, 820, 340);
    this.add
      .text(640, 250, "큰 글씨 한 문제 모드", {
        fontFamily: "Arial, sans-serif",
        fontSize: "38px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const teamText = this.add
      .text(640, 330, `현재 차례: ${this.teams[this.teamIndex]}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "34px",
        color: "#ffd761",
      })
      .setOrigin(0.5);
    this.addButton(500, 430, "교대", () => {
      this.teamIndex = (this.teamIndex + 1) % this.teams.length;
      teamText.setText(`현재 차례: ${this.teams[this.teamIndex]}`);
    }, 200);
    this.addButton(730, 430, "게임 시작", () => this.scene.start("GameScene", { mode: "classroom", level: LevelManager.classroomLevel() }), 240);
    this.addButton(1040, 640, "메뉴", () => this.scene.start("MenuScene"), 170);
  }
}
