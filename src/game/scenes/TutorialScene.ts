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
    this.addInstructionTextOverlay(left, top, scale);
    this.addHotspot({ x: 624, y: 828, width: 368, height: 112 }, left, top, scale, () => this.scene.start("LevelSelectScene"));
    this.addHotspot({ x: 1058, y: 828, width: 368, height: 112 }, left, top, scale, () => this.scene.start("MenuScene"));
  }

  private addInstructionTextOverlay(imageLeft: number, imageTop: number, imageScale: number): void {
    const instructions = [
      "목표 숫자를 소인수로 나눌 순서를 찾는다",
      "기본은 소수 보석을 탭해서 하나씩 선택한다",
      "끊지 않고 이어 드래그하면 콤보로 연결된다",
      "예: 32는 2를 다섯 번 선택한다",
      "한 번에 완성하거나 길게 연결하면 보너스 점수",
    ];
    const rowY = [324, 454, 584, 714, 844];

    instructions.forEach((line, index) => {
      const y = imageTop + rowY[index]! * imageScale;
      const panel = this.add.graphics().setDepth(5);
      panel.fillStyle(0x050b2b, 0.88);
      panel.fillRoundedRect(imageLeft + 300 * imageScale, y - 48 * imageScale, 1190 * imageScale, 96 * imageScale, 20 * imageScale);
      panel.lineStyle(1.5 * imageScale, 0x7ff3ff, 0.18);
      panel.strokeRoundedRect(imageLeft + 300 * imageScale, y - 48 * imageScale, 1190 * imageScale, 96 * imageScale, 20 * imageScale);

      this.add
        .text(imageLeft + 328 * imageScale, y, line, {
          fontFamily: "Arial, sans-serif",
          fontSize: `${Math.round(48 * imageScale)}px`,
          color: "#fff8d8",
          fontStyle: "bold",
          stroke: "#080b20",
          strokeThickness: Math.max(4, Math.round(7 * imageScale)),
        })
        .setOrigin(0, 0.5)
        .setDepth(6);
    });
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
