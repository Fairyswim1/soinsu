import Phaser from "phaser";
import { PRIME_POP_BUTTON_ASSETS, PRIME_POP_SCREEN_ASSETS } from "../config/primePopAssets";
import { SaveManager } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

export class MenuScene extends BaseScene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.drawTitleScreen();
    this.addImageButton(640, 520, PRIME_POP_BUTTON_ASSETS.start.key, () => this.scene.start("LevelSelectScene"), 300, 124);
    this.addImageButton(640, 620, PRIME_POP_BUTTON_ASSETS.howto.key, () => this.scene.start("TutorialScene"), 230, 96);

    this.addButton(430, 680, "빠른 연습", () => this.scene.start("QuickPracticeScene"), 170);
    this.addButton(850, 680, "교실 모드", () => this.scene.start("ClassroomScene"), 170);
    this.addButton(1100, 680, "설정", () => this.scene.start("SettingsScene"), 140);
    SaveManager.update((data) => ({ ...data, lastMode: "campaign" }));
  }

  private drawTitleScreen(): void {
    const image = this.add.image(640, 360, PRIME_POP_SCREEN_ASSETS.titleScreen.key);
    const source = this.textures.get(PRIME_POP_SCREEN_ASSETS.titleScreen.key).getSourceImage() as HTMLImageElement;
    const scale = Math.max(1280 / source.width, 720 / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
    this.add.rectangle(640, 360, 1280, 720, 0x03091e, 0.08);
  }

  private addImageButton(
    x: number,
    y: number,
    key: string,
    onClick: () => void,
    width: number,
    height: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const button = this.add.image(0, 0, key);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const fit = Math.min(width / source.width, height / source.height);
    button.setScale(fit);
    container.add(button);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on("pointerover", () => this.tweens.add({ targets: container, scale: 1.03, duration: 130, ease: "Sine.easeOut" }));
    container.on("pointerout", () => this.tweens.add({ targets: container, scale: 1, duration: 130, ease: "Sine.easeOut" }));
    container.on("pointerdown", () => this.tweens.add({ targets: container, scale: 0.96, duration: 80, ease: "Sine.easeOut" }));
    container.on("pointerup", () => {
      this.tweens.add({ targets: container, scale: 1, duration: 100, ease: "Sine.easeOut" });
      onClick();
    });
    return container;
  }
}
