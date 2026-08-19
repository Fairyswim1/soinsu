import { gameConfig } from "../config/gameConfig";
import { levels } from "../config/levels";
import { PRIME_POP_SETTINGS_ASSETS } from "../config/primePopAssets";
import { gameFontFamily } from "../config/theme";
import { sharedAudioManager } from "../systems/AudioManager";
import { SaveManager, type SaveData } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

type SourcePoint = {
  x: number;
  y: number;
};

type SourceFrame = SourcePoint & {
  width: number;
};

type ScaledBackground = {
  left: number;
  top: number;
  scale: number;
};

export class SettingsScene extends BaseScene {
  private save!: SaveData;
  private reducedMotion = false;
  private mutedText?: Phaser.GameObjects.Text;
  private motionText?: Phaser.GameObjects.Text;

  constructor() {
    super("SettingsScene");
  }

  create(): void {
    this.save = SaveManager.load();
    this.reducedMotion = this.save.reducedMotion;
    const background = this.addSettingsBackground();

    this.mutedText = this.addStatusText({ x: 1088, y: 288 }, background, this.save.muted);
    this.motionText = this.addStatusText({ x: 1088, y: 406 }, background, this.save.reducedMotion);

    this.addImageButton({ x: 604, y: 552, width: 430 }, background, PRIME_POP_SETTINGS_ASSETS.toggleMute.key, () => {
      const next = SaveManager.update((data) => ({ ...data, muted: !data.muted }));
      this.save = next;
      sharedAudioManager.setMuted(next.muted);
      this.mutedText?.setText(this.statusLabel(next.muted));
    });
    this.addImageButton({ x: 1084, y: 552, width: 430 }, background, PRIME_POP_SETTINGS_ASSETS.toggleReduceMotion.key, () => {
      const next = SaveManager.update((data) => ({ ...data, reducedMotion: !data.reducedMotion }));
      this.save = next;
      this.reducedMotion = next.reducedMotion;
      this.motionText?.setText(this.statusLabel(next.reducedMotion));
    });
    this.addImageButton({ x: 604, y: 682, width: 430 }, background, PRIME_POP_SETTINGS_ASSETS.unlockAll.key, () => {
      SaveManager.update((data) => ({ ...data, unlockedLevel: levels.length }));
      this.scene.start("LevelSelectScene");
    });
    this.addImageButton({ x: 1084, y: 682, width: 430 }, background, PRIME_POP_SETTINGS_ASSETS.resetSave.key, () => {
      SaveManager.update((data) => ({
        ...data,
        tutorialComplete: false,
        unlockedLevel: 1,
        levelScores: {},
        levelStars: {},
        muted: false,
        musicVolume: 0.35,
        sfxVolume: 0.7,
        reducedMotion: false,
      }));
      sharedAudioManager.setMuted(false);
      sharedAudioManager.setMusicVolume(0.35);
      sharedAudioManager.setVolume(0.7);
      this.scene.restart();
    });
    this.addImageButton({ x: 836, y: 846, width: 420 }, background, PRIME_POP_SETTINGS_ASSETS.menu.key, () => {
      this.scene.start("MenuScene");
    });
  }

  private addSettingsBackground(): ScaledBackground {
    const key = PRIME_POP_SETTINGS_ASSETS.background.key;
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const scale = Math.max(gameConfig.width / source.width, gameConfig.height / source.height);
    const displayWidth = source.width * scale;
    const displayHeight = source.height * scale;
    const left = gameConfig.width / 2 - displayWidth / 2;
    const top = gameConfig.height / 2 - displayHeight / 2;

    this.add.image(gameConfig.width / 2, gameConfig.height / 2, key).setDisplaySize(displayWidth, displayHeight);
    return { left, top, scale };
  }

  private addStatusText(point: SourcePoint, background: ScaledBackground, enabled: boolean): Phaser.GameObjects.Text {
    return this.add
      .text(background.left + point.x * background.scale, background.top + point.y * background.scale, this.statusLabel(enabled), {
        fontFamily: gameFontFamily,
        fontSize: `${Math.round(38 * background.scale)}px`,
        color: "#fff8d8",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: Math.max(3, Math.round(5 * background.scale)),
        shadow: { offsetX: 0, offsetY: Math.max(1, Math.round(2 * background.scale)), color: "#06113d", blur: 6, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(10);
  }

  private addImageButton(sourceFrame: SourceFrame, background: ScaledBackground, key: string, onClick: () => void): void {
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const x = background.left + sourceFrame.x * background.scale;
    const y = background.top + sourceFrame.y * background.scale;
    const width = sourceFrame.width * background.scale;
    const scale = width / source.width;
    const height = source.height * scale;
    const image = this.add.image(x, y, key).setScale(scale).setDepth(8);
    const hotspot = this.add.zone(x, y, width, height).setDepth(12);

    hotspot.setInteractive({ useHandCursor: true });
    hotspot.on("pointerover", () => {
      image.setTint(0xffffff);
      if (!this.reducedMotion) this.tweens.add({ targets: image, scale: scale * 1.02, duration: 90, ease: "Sine.easeOut" });
    });
    hotspot.on("pointerout", () => {
      image.clearTint();
      if (!this.reducedMotion) this.tweens.add({ targets: image, scale, duration: 90, ease: "Sine.easeOut" });
      else image.setScale(scale);
    });
    hotspot.on("pointerdown", () => {
      if (!this.reducedMotion) this.tweens.add({ targets: image, scale: scale * 0.965, duration: 70, yoyo: true, ease: "Sine.easeOut" });
      else image.setScale(scale * 0.98);
    });
    hotspot.on("pointerup", () => {
      image.setScale(scale);
      onClick();
    });
  }

  private statusLabel(enabled: boolean): string {
    return enabled ? "켜짐" : "꺼짐";
  }
}
