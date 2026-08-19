import Phaser from "phaser";
import { gameConfig } from "../config/gameConfig";
import { PRIME_POP_BUTTON_ASSETS, PRIME_POP_SCREEN_ASSETS } from "../config/primePopAssets";
import { SaveManager } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

export class MenuScene extends BaseScene {
  private readonly menuButtons: Phaser.GameObjects.Container[] = [];
  private keyboardFocusIndex = -1;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.drawTitleScreen();
    this.menuButtons.length = 0;
    this.keyboardFocusIndex = -1;

    this.addImageButton({
      x: 640,
      y: 636,
      key: PRIME_POP_BUTTON_ASSETS.start.key,
      alt: "게임 시작",
      onClick: () => this.scene.start("LevelSelectScene", { mode: "campaign" }),
      width: 240,
      height: 93,
      glowColor: 0xffe36a,
      primary: true,
    });
    this.addImageButton({
      x: 640,
      y: 720,
      key: PRIME_POP_BUTTON_ASSETS.howto.key,
      alt: "게임 방법",
      onClick: () => this.scene.start("TutorialScene"),
      width: 176,
      height: 68,
      glowColor: 0x72ecff,
    });
    this.addSecondaryButtonGroup();
    this.registerKeyboardMenuNavigation();

    SaveManager.update((data) => ({ ...data, lastMode: "campaign" }));
  }

  private drawTitleScreen(): void {
    const image = this.add.image(gameConfig.width / 2, gameConfig.height / 2, PRIME_POP_SCREEN_ASSETS.titleScreen.key);
    const source = this.textures.get(PRIME_POP_SCREEN_ASSETS.titleScreen.key).getSourceImage() as HTMLImageElement;
    const scale = Math.max(gameConfig.width / source.width, gameConfig.height / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
    this.add.rectangle(gameConfig.width / 2, gameConfig.height / 2, gameConfig.width, gameConfig.height, 0x03091e, 0.08);
  }

  private addSecondaryButtonGroup(): void {
    const isNarrowDisplay = this.scale.displaySize.width > 0 && this.scale.displaySize.width < 760;
    const group = this.add.container(640, isNarrowDisplay ? 802 : 812);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x020718, 0.28);
    shadow.fillEllipse(0, 4, isNarrowDisplay ? 600 : 680, isNarrowDisplay ? 148 : 92);
    group.add(shadow);

    const secondaryButtons = [
      {
        x: isNarrowDisplay ? -112 : -230,
        y: isNarrowDisplay ? -28 : 0,
        key: PRIME_POP_BUTTON_ASSETS.quickPractice.key,
        alt: "빠른 연습",
        onClick: () => this.scene.start("QuickPracticeScene"),
      },
      {
        x: isNarrowDisplay ? 112 : 0,
        y: isNarrowDisplay ? -28 : 0,
        key: PRIME_POP_BUTTON_ASSETS.classroomMode.key,
        alt: "대결 모드",
        onClick: () => this.scene.start("ClassroomScene"),
      },
      {
        x: isNarrowDisplay ? 0 : 230,
        y: isNarrowDisplay ? 56 : 0,
        key: PRIME_POP_BUTTON_ASSETS.settings.key,
        alt: "설정",
        onClick: () => this.scene.start("SettingsScene"),
      },
    ];

    for (const button of secondaryButtons) {
      group.add(
        this.addImageButton({
          x: button.x,
          y: button.y,
          key: button.key,
          alt: button.alt,
          onClick: button.onClick,
          width: isNarrowDisplay ? 210 : 198,
          height: isNarrowDisplay ? 140 : 132,
          glowColor: 0x8beeff,
        }),
      );
    }
  }

  private addImageButton({
    x,
    y,
    key,
    alt,
    onClick,
    width,
    height,
    glowColor,
    primary = false,
  }: {
    x: number;
    y: number;
    key: string;
    alt: string;
    onClick: () => void;
    width: number;
    height: number;
    glowColor: number;
    primary?: boolean;
  }): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const fit = Math.min(width / source.width, height / source.height);
    const displayWidth = source.width * fit;
    const displayHeight = source.height * fit;

    const glow = this.add.image(0, 0, key);
    glow.setScale(fit);
    glow.setTint(glowColor);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setAlpha(0);

    const focusRing = this.add.graphics();
    const drawFocusRing = (alpha: number): void => {
      focusRing.clear();
      focusRing.lineStyle(primary ? 5 : 4, glowColor, alpha);
      focusRing.strokeRoundedRect(-displayWidth / 2 - 8, -displayHeight / 2 - 8, displayWidth + 16, displayHeight + 16, 24);
    };
    drawFocusRing(0);

    const button = this.add.image(0, 0, key);
    button.setScale(fit);
    button.setName(alt);

    container.add([glow, focusRing, button]);
    container.setSize(displayWidth, displayHeight);
    container.setInteractive({ useHandCursor: true });

    const setFocused = (focused: boolean): void => drawFocusRing(focused ? 0.78 : 0);
    const setHover = (hovered: boolean): void => {
      this.tweens.add({
        targets: container,
        scale: hovered ? 1.03 : 1,
        duration: 165,
        ease: "Sine.easeOut",
      });
      this.tweens.add({
        targets: glow,
        alpha: hovered ? 0.22 : 0,
        scale: hovered ? fit * 1.035 : fit,
        duration: 165,
        ease: "Sine.easeOut",
      });
    };

    container.setData("setFocused", setFocused);
    container.setData("activate", onClick);
    container.on("pointerover", () => setHover(true));
    container.on("pointerout", () => setHover(false));
    container.on("pointerdown", () => this.tweens.add({ targets: container, scale: 0.96, duration: 80, ease: "Sine.easeOut" }));
    container.on("pointerup", () => {
      this.tweens.add({ targets: container, scale: 1.03, duration: 100, ease: "Sine.easeOut" });
      onClick();
    });

    this.menuButtons.push(container);
    return container;
  }

  private registerKeyboardMenuNavigation(): void {
    this.input.keyboard?.on("keydown-TAB", (event: KeyboardEvent) => {
      event.preventDefault();
      const direction = event.shiftKey ? -1 : 1;
      this.focusMenuButton(this.keyboardFocusIndex + direction);
    });
    this.input.keyboard?.on("keydown-ENTER", () => this.activateFocusedMenuButton());
    this.input.keyboard?.on("keydown-SPACE", () => this.activateFocusedMenuButton());
  }

  private focusMenuButton(index: number): void {
    if (this.menuButtons.length === 0) return;
    if (this.keyboardFocusIndex >= 0) {
      const clearFocus = this.menuButtons[this.keyboardFocusIndex].getData("setFocused") as ((focused: boolean) => void) | undefined;
      clearFocus?.(false);
    }
    this.keyboardFocusIndex = Phaser.Math.Wrap(index, 0, this.menuButtons.length);
    const setFocus = this.menuButtons[this.keyboardFocusIndex].getData("setFocused") as ((focused: boolean) => void) | undefined;
    setFocus?.(true);
  }

  private activateFocusedMenuButton(): void {
    if (this.keyboardFocusIndex < 0) return;
    const button = this.menuButtons[this.keyboardFocusIndex];
    this.tweens.add({ targets: button, scale: 0.96, yoyo: true, duration: 80, ease: "Sine.easeOut" });
    const activate = button.getData("activate") as (() => void) | undefined;
    activate?.();
  }
}
