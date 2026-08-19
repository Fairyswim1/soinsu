import { gameConfig } from "../config/gameConfig";
import { PRIME_POP_PRACTICE_ASSETS } from "../config/primePopAssets";
import { gameFontFamily } from "../config/theme";
import type { LevelConfig } from "../models/LevelModel";
import { LevelManager } from "../systems/LevelManager";
import { BaseScene } from "./BaseScene";

type SourcePoint = {
  x: number;
  y: number;
};

type SourceRect = SourcePoint & {
  width: number;
  height: number;
};

type ScaledBackground = {
  left: number;
  top: number;
  scale: number;
};

export class QuickPracticeScene extends BaseScene {
  constructor() {
    super("QuickPracticeScene");
  }

  create(): void {
    const level = LevelManager.quickPracticeLevel();
    const background = this.addPracticeBackground();

    this.maskImageText({ x: 766, y: 421, width: 1180, height: 118 }, background, 28);
    this.maskImageText({ x: 766, y: 552, width: 960, height: 98 }, background, 24);
    this.addPracticeData(background, level);
    this.addDescription(background);

    this.addGlossyButton({ x: 557, y: 735, width: 374, height: 118 }, background, "▶", "시작", "cyan", () => {
      this.scene.start("GameScene", { mode: "quick", level });
    });
    this.addGlossyButton({ x: 974, y: 735, width: 374, height: 118 }, background, "☰", "메뉴", "violet", () => {
      this.scene.start("MenuScene");
    });
  }

  private addPracticeBackground(): ScaledBackground {
    const key = PRIME_POP_PRACTICE_ASSETS.quickPracticeBackground.key;
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const scale = Math.max(gameConfig.width / source.width, gameConfig.height / source.height);
    const displayWidth = source.width * scale;
    const displayHeight = source.height * scale;
    const left = gameConfig.width / 2 - displayWidth / 2;
    const top = gameConfig.height / 2 - displayHeight / 2;

    this.add.image(gameConfig.width / 2, gameConfig.height / 2, key).setDisplaySize(displayWidth, displayHeight);
    return { left, top, scale };
  }

  private addPracticeData(background: ScaledBackground, level: LevelConfig): void {
    const rowY = this.sourceY(421, background);
    const fontSize = Math.round(34 * background.scale);
    this.addDataText(this.sourceX(450, background), rowY, "목표:", level.targets.join(", "), fontSize, 440 * background.scale);
    this.addDataText(this.sourceX(805, background), rowY, "소수:", level.availablePrimes.join(", "), fontSize, 300 * background.scale);
    this.addDataText(this.sourceX(1130, background), rowY, "남은 터치:", String(level.moves), fontSize, 310 * background.scale);
  }

  private addDataText(x: number, y: number, label: string, value: string, fontSize: number, maxWidth: number): void {
    const group = this.add.container(x, y).setDepth(8);
    const labelText = this.add
      .text(0, 0, label, {
        fontFamily: gameFontFamily,
        fontSize: `${fontSize}px`,
        color: "#07164b",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: Math.max(2, Math.round(fontSize * 0.08)),
      })
      .setOrigin(0, 0.5)
      .setResolution(2);
    const valueText = this.add
      .text(20, 0, value, {
        fontFamily: gameFontFamily,
        fontSize: `${fontSize}px`,
        color: "#d66b12",
        fontStyle: "bold",
        stroke: "#fff3df",
        strokeThickness: Math.max(2, Math.round(fontSize * 0.07)),
      })
      .setOrigin(0, 0.5)
      .setResolution(2);
    const gap = 16 * (fontSize / 34);
    const totalWidth = labelText.width + gap + valueText.width;
    labelText.setX(-totalWidth / 2);
    valueText.setX(-totalWidth / 2 + labelText.width + gap);
    const fit = Math.min(1, maxWidth / totalWidth);
    group.setScale(fit);
    group.add([labelText, valueText]);
  }

  private addDescription(background: ScaledBackground): void {
    this.add
      .text(this.sourceX(766, background), this.sourceY(552, background), "누구나 자유롭게 연습할 수 있는 기본 연습 모드입니다.", {
        fontFamily: gameFontFamily,
        fontSize: `${Math.round(38 * background.scale)}px`,
        color: "#10245e",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: Math.max(2, Math.round(3 * background.scale)),
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(8);
  }

  private maskImageText(rect: SourceRect, background: ScaledBackground, radius: number): void {
    const x = this.sourceX(rect.x, background);
    const y = this.sourceY(rect.y, background);
    const width = rect.width * background.scale;
    const height = rect.height * background.scale;
    const graphics = this.add.graphics().setDepth(7);
    graphics.fillStyle(0xf5f1eb, 1);
    graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius * background.scale);
  }

  private addGlossyButton(
    rect: SourceRect,
    background: ScaledBackground,
    icon: string,
    label: string,
    variant: "cyan" | "violet",
    onClick: () => void,
  ): void {
    const x = this.sourceX(rect.x, background);
    const y = this.sourceY(rect.y, background);
    const width = rect.width * background.scale;
    const height = rect.height * background.scale;
    const radius = height / 2;
    const container = this.add.container(x, y).setDepth(12);
    const graphics = this.add.graphics();
    const colors =
      variant === "cyan"
        ? { outer: 0xffd86b, border: 0x35efff, top: 0x27dcff, bottom: 0x056ee4, shine: 0xffffff }
        : { outer: 0xffd86b, border: 0xd782ff, top: 0xc247ff, bottom: 0x6132dc, shine: 0xffffff };

    graphics.fillStyle(colors.outer, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.fillStyle(colors.border, 1);
    graphics.fillRoundedRect(-width / 2 + 8 * background.scale, -height / 2 + 8 * background.scale, width - 16 * background.scale, height - 16 * background.scale, radius);
    graphics.fillStyle(colors.bottom, 1);
    graphics.fillRoundedRect(-width / 2 + 16 * background.scale, -height / 2 + 16 * background.scale, width - 32 * background.scale, height - 32 * background.scale, radius);
    graphics.fillStyle(colors.top, 0.92);
    graphics.fillRoundedRect(-width / 2 + 22 * background.scale, -height / 2 + 18 * background.scale, width - 44 * background.scale, height * 0.46, radius * 0.6);
    graphics.fillStyle(colors.shine, 0.22);
    graphics.fillRoundedRect(-width * 0.35, -height * 0.32, width * 0.54, height * 0.16, height * 0.08);

    const iconText = this.add
      .text(-width * 0.2, 0, icon, {
        fontFamily: gameFontFamily,
        fontSize: `${Math.round(54 * background.scale)}px`,
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#14205f",
        strokeThickness: Math.max(4, Math.round(6 * background.scale)),
      })
      .setOrigin(0.5)
      .setResolution(2);
    const labelText = this.add
      .text(width * 0.08, 0, label, {
        fontFamily: gameFontFamily,
        fontSize: `${Math.round(54 * background.scale)}px`,
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#14205f",
        strokeThickness: Math.max(4, Math.round(7 * background.scale)),
        shadow: { offsetX: 0, offsetY: 2, color: "#06113d", blur: 6, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(2);

    container.add([graphics, iconText, labelText]);
    const hotspot = this.add.zone(x, y, width, height).setDepth(20);
    hotspot.setInteractive({ useHandCursor: true });
    hotspot.on("pointerover", () => this.tweens.add({ targets: container, scale: 1.03, duration: 100, ease: "Sine.easeOut" }));
    hotspot.on("pointerout", () => this.tweens.add({ targets: container, scale: 1, duration: 100, ease: "Sine.easeOut" }));
    hotspot.on("pointerdown", () => this.tweens.add({ targets: container, scale: 0.96, duration: 80, ease: "Sine.easeOut" }));
    hotspot.on("pointerup", () => {
      container.setScale(1);
      onClick();
    });
  }

  private sourceX(x: number, background: ScaledBackground): number {
    return background.left + x * background.scale;
  }

  private sourceY(y: number, background: ScaledBackground): number {
    return background.top + y * background.scale;
  }
}
