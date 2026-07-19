import Phaser from "phaser";
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
    const bg = this.add
      .rectangle(0, 0, width, 58, uiTheme.accent, 0.95)
      .setStrokeStyle(3, 0xffffff, 0.58);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "23px",
        color: "#102144",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(width, 58);
    container.setInteractive({ useHandCursor: true });
    container.on("pointerdown", () => {
      this.tweens.add({ targets: container, scale: 0.96, duration: 70, yoyo: true });
      onClick();
    });
    container.on("pointerover", () => bg.setFillStyle(0x89edff, 1));
    container.on("pointerout", () => bg.setFillStyle(uiTheme.accent, 0.95));
    return container;
  }

  protected addPanel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(x, y, width, height, uiTheme.panel, 0.86).setStrokeStyle(2, 0xffffff, 0.18);
  }

  protected addBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x151a3d, 0x151a3d, 0x243f72, 0x301e58, 1);
    g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 42; i += 1) {
      const x = 40 + ((i * 191) % 1200);
      const y = 40 + ((i * 89) % 620);
      g.fillStyle(i % 3 === 0 ? 0x5be0ff : 0xffd761, 0.12);
      g.fillCircle(x, y, 2 + (i % 5));
    }
  }
}
