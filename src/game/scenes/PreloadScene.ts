import { assetManifest } from "../config/assetManifest";
import { primeThemes } from "../config/theme";
import { supportedPrimes } from "../models/CandyModel";
import { BaseScene } from "./BaseScene";

export class PreloadScene extends BaseScene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    for (const asset of assetManifest) {
      if (asset.type === "image") {
        this.load.image(asset.key, asset.path);
      } else {
        this.load.audio(asset.key, asset.path);
      }
    }
  }

  create(): void {
    this.createFallbackTextures();
    this.scene.start("MenuScene");
  }

  private createFallbackTextures(): void {
    for (const prime of supportedPrimes) {
      const key = `candy-${prime}`;
      if (this.textures.exists(key)) continue;
      const theme = primeThemes[prime];
      const g = this.add.graphics();
      g.clear();
      g.fillStyle(theme.dark, 1);
      g.fillCircle(48, 52, 38);
      g.fillStyle(theme.color, 1);
      if (theme.shape === "circle") {
        g.fillCircle(48, 48, 36);
      } else if (theme.shape === "roundRect") {
        g.fillRoundedRect(12, 14, 72, 68, 20);
      } else if (theme.shape === "drop") {
        g.fillCircle(48, 56, 30);
        g.fillTriangle(48, 8, 22, 52, 74, 52);
      } else if (theme.shape === "star") {
        this.drawStar(g, 48, 48, 34, 18, theme.color);
      } else {
        g.fillPoints(
          [
            new Phaser.Geom.Point(48, 8),
            new Phaser.Geom.Point(82, 28),
            new Phaser.Geom.Point(82, 68),
            new Phaser.Geom.Point(48, 88),
            new Phaser.Geom.Point(14, 68),
            new Phaser.Geom.Point(14, 28),
          ],
          true,
        );
      }
      g.fillStyle(theme.highlight, 0.85);
      g.fillCircle(36, 32, 10);
      g.generateTexture(key, 96, 96);
      g.destroy();
    }
  }

  private drawStar(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    outer: number,
    inner: number,
    color: number,
  ): void {
    const points: Phaser.Geom.Point[] = [];
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      points.push(new Phaser.Geom.Point(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius));
    }
    graphics.fillStyle(color, 1);
    graphics.fillPoints(points, true);
  }
}
