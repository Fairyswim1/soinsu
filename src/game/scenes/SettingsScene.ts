import { SaveManager } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

export class SettingsScene extends BaseScene {
  constructor() {
    super("SettingsScene");
  }

  create(): void {
    this.addBackground();
    this.addTitle("설정", 80);
    const save = SaveManager.load();
    const mutedText = this.add
      .text(640, 230, `음소거: ${save.muted ? "켜짐" : "꺼짐"}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    const motionText = this.add
      .text(640, 300, `모션 감소: ${save.reducedMotion ? "켜짐" : "꺼짐"}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.addButton(500, 390, "음소거 전환", () => {
      const next = SaveManager.update((data) => ({ ...data, muted: !data.muted }));
      mutedText.setText(`음소거: ${next.muted ? "켜짐" : "꺼짐"}`);
    }, 230);
    this.addButton(780, 390, "모션 감소 전환", () => {
      const next = SaveManager.update((data) => ({ ...data, reducedMotion: !data.reducedMotion }));
      motionText.setText(`모션 감소: ${next.reducedMotion ? "켜짐" : "꺼짐"}`);
    }, 260);
    this.addButton(500, 480, "저장 초기화", () => {
      SaveManager.reset();
      this.scene.restart();
    }, 230);
    this.addButton(780, 480, "모든 레벨 해금", () => {
      SaveManager.update((data) => ({ ...data, unlockedLevel: 15 }));
      this.scene.start("LevelSelectScene");
    }, 260);
    this.addButton(640, 590, "메뉴", () => this.scene.start("MenuScene"), 220);
  }
}
