import Phaser from "phaser";
import { PRIME_POP_BOARD_ASSETS } from "../config/primePopAssets";
import { uiTheme } from "../config/theme";

export class BaseScene extends Phaser.Scene {
  protected addTitle(text: string, y = 62): Phaser.GameObjects.Text {
    return this.add
      .text(640, y, text, {
        fontFamily: "Arial, sans-serif",
        fontSize: "42px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#24306f",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
  }

  protected addButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 250,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const drawButton = (fill: number): void => {
      bg.clear();
      bg.fillStyle(0x071035, 0.72);
      bg.fillRoundedRect(-width / 2, -24, width, 58, 18);
      bg.fillStyle(fill, 0.98);
      bg.fillRoundedRect(-width / 2, -29, width, 58, 18);
      bg.lineStyle(2, 0x75ecff, 0.48);
      bg.strokeRoundedRect(-width / 2, -29, width, 58, 18);
      bg.fillStyle(0x7deeff, 0.16);
      bg.fillRoundedRect(-width / 2 + 8, -24, width - 16, 20, 12);
      bg.lineStyle(2, 0xa98aff, 0.25);
      bg.strokeRoundedRect(-width / 2 + 3, -26, width - 6, 52, 16);
    };
    drawButton(0x17225e);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "21px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(width, 58);
    container.setInteractive({ useHandCursor: true });
    container.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 70, yoyo: true });
      onClick();
    });
    container.on("pointerover", () => drawButton(0x24337c));
    container.on("pointerout", () => drawButton(0x17225e));
    return container;
  }

  protected addPanel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(x, y, width, height, uiTheme.panel, 0.86).setStrokeStyle(2, 0xffffff, 0.18);
  }

  protected addBackground(): void {
    if (this.textures.exists(PRIME_POP_BOARD_ASSETS.background.key)) {
      const image = this.add.image(640, 360, PRIME_POP_BOARD_ASSETS.background.key);
      const source = this.textures.get(PRIME_POP_BOARD_ASSETS.background.key).getSourceImage() as HTMLImageElement;
      const scale = Math.max(1280 / source.width, 720 / source.height);
      image.setDisplaySize(source.width * scale, source.height * scale);
      this.add.rectangle(640, 360, 1280, 720, 0x04071f, 0.18);
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(0x070b26, 0x10194d, 0x192e69, 0x321e66, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x5be0ff, 0.08);
    g.fillCircle(110, 120, 190);
    g.fillStyle(0x9f7cff, 0.08);
    g.fillCircle(1160, 130, 210);
    g.fillStyle(0xffd761, 0.06);
    g.fillCircle(1120, 650, 180);
    g.fillStyle(0x080d2b, 0.26);
    g.fillRoundedRect(330, 8, 620, 704, 32);
    for (let i = 0; i < 72; i += 1) {
      const x = 40 + ((i * 191) % 1200);
      const y = 40 + ((i * 89) % 620);
      const alpha = x > 320 && x < 960 && y > 150 && y < 610 ? 0.05 : 0.15;
      g.fillStyle(i % 4 === 0 ? 0x5be0ff : i % 4 === 1 ? 0xffd761 : 0xff7bdc, alpha);
      g.fillCircle(x, y, 1.5 + (i % 4));
    }
  }
}
