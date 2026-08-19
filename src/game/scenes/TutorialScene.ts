import { gameConfig } from "../config/gameConfig";
import { PRIME_POP_SCREEN_ASSETS } from "../config/primePopAssets";
import { BaseScene } from "./BaseScene";

type ImageButtonBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class TutorialScene extends BaseScene {
  constructor() {
    super("TutorialScene");
  }

  create(): void {
    const image = this.add.image(gameConfig.width / 2, gameConfig.height / 2, PRIME_POP_SCREEN_ASSETS.tutorialScreen.key);
    const source = this.textures.get(PRIME_POP_SCREEN_ASSETS.tutorialScreen.key).getSourceImage() as HTMLImageElement;
    const scale = Math.max(gameConfig.width / source.width, gameConfig.height / source.height);
    const displayWidth = source.width * scale;
    const displayHeight = source.height * scale;
    const left = gameConfig.width / 2 - displayWidth / 2;
    const top = gameConfig.height / 2 - displayHeight / 2;

    image.setDisplaySize(displayWidth, displayHeight);
    this.addHotspot({ x: 624, y: 828, width: 368, height: 112 }, left, top, scale, () => this.scene.start("LevelSelectScene"));
    this.addHotspot({ x: 1058, y: 828, width: 368, height: 112 }, left, top, scale, () => this.scene.start("MenuScene"));
  }

  private addHotspot(
    sourceBounds: ImageButtonBounds,
    imageLeft: number,
    imageTop: number,
    imageScale: number,
    onClick: () => void,
  ): void {
    const x = imageLeft + sourceBounds.x * imageScale;
    const y = imageTop + sourceBounds.y * imageScale;
    const width = sourceBounds.width * imageScale;
    const height = sourceBounds.height * imageScale;
    const hotspot = this.add.zone(x, y, width, height).setDepth(20);

    hotspot.setInteractive({ useHandCursor: true });
    hotspot.on("pointerdown", () => {
      this.tweens.add({ targets: hotspot, scale: 0.98, duration: 60, yoyo: true });
    });
    hotspot.on("pointerup", () => {
      onClick();
    });
  }
}
