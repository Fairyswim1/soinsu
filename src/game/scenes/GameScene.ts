import Phaser from "phaser";
import { gameConfig } from "../config/gameConfig";
import {
  PRIME_POP_BOARD_ASSETS,
  PRIME_POP_BUTTON_ASSETS,
  PRIME_POP_EFFECT_ASSETS,
  PRIME_POP_AUDIO_ASSETS,
  PRIME_POP_GAMEPLAY_ASSETS,
  PRIME_POP_WORLD_MAP_ASSETS,
  PRIME_TILE_ASSETS,
  primeTileKey,
} from "../config/primePopAssets";
import { gameFontFamily } from "../config/theme";
import type { Blocker } from "../models/BlockerModel";
import type { Board, Candy, Prime, SpecialCandy } from "../models/CandyModel";
import { createSession, type ClassroomState, type GameMode, type GameSession } from "../models/GameSession";
import type { LevelConfig } from "../models/LevelModel";
import { sharedAudioManager } from "../systems/AudioManager";
import { BlockerSystem } from "../systems/BlockerSystem";
import { BoardGenerator } from "../systems/BoardGenerator";
import { FactorizationEngine } from "../systems/FactorizationEngine";
import { HintSystem } from "../systems/HintSystem";
import { LevelManager } from "../systems/LevelManager";
import { SaveManager } from "../systems/SaveManager";
import { ScoreSystem } from "../systems/ScoreSystem";
import { SelectionSystem } from "../systems/SelectionSystem";
import { SpecialCandySystem } from "../systems/SpecialCandySystem";
import { requestFullscreen } from "../utils/responsive";
import { BaseScene } from "./BaseScene";

type GameSceneData = {
  mode?: GameMode;
  levelId?: number;
  level?: LevelConfig;
  classroomState?: ClassroomState;
};


const LEVEL_DISPLAY_TITLES: Record<number, string> = {
  1: "\uCCAB \uC5F0\uACB0",
  2: "5\uC758 \uB4F1\uC7A5",
  3: "\uAC19\uC740 \uC18C\uC218 \uBC18\uBCF5",
  4: "\uAE34 \uC5F0\uACB0 \uBCF4\uB108\uC2A4",
  5: "\uC81C\uD55C \uD130\uCE58",
  6: "\uB113\uC5B4\uC9C4 \uC120\uD0DD\uC9C0",
  7: "7\uC758 \uB4F1\uC7A5",
  8: "\uD070 \uC218 \uBD84\uD574",
  9: "\uC5EC\uB7EC \uBAA9\uD45C \uC5F0\uC18D",
  10: "\uCD5C\uC885 \uBD84\uD574",
};

const boardLayout = {
  centerX: 640,
  centerY: 525,
  frameWidth: 1130,
  frameHeight: 620,
  trayWidth: 1040,
  trayHeight: 570,
  trayPaddingX: 38,
  trayPaddingY: 24,
  gapX: 8,
  gapY: 8,
};

const GAMEPLAY_UI_CROPS = {
  stageHeader: { x: 25, y: 311, width: 1485, height: 345 },
  targetPanel: { x: 194, y: 223, width: 1147, height: 527 },
  factorChain: { x: 16, y: 281, width: 1504, height: 438 },
  hudBar: { x: 6, y: 444, width: 1241, height: 294 },
  missionPanel: { x: 0, y: 485, width: 1254, height: 258 },
  backToTitle: { x: 8, y: 384, width: 1239, height: 444 },
};

export class GameScene extends BaseScene {
  private board!: Board;
  private generator!: BoardGenerator;
  private selection!: SelectionSystem;
  private session!: GameSession;
  private blockers: Blocker[] = [];
  private readonly audio = sharedAudioManager;
  private readonly candyObjects = new Map<string, Phaser.GameObjects.Container>();
  private boardLayer!: Phaser.GameObjects.Container;
  private pathLayer!: Phaser.GameObjects.Graphics;
  private blockerLayer!: Phaser.GameObjects.Container;
  private cellSize = 60;
  private boardX = 0;
  private boardY = 0;
  private isDragging = false;
  private inputLocked = false;
  private isPaused = false;
  private lastPointerCellKey?: string;
  private timerEvent?: Phaser.Time.TimerEvent;
  private equationText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private classroomTurnText?: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private factorsText!: Phaser.GameObjects.Text;
  private missionIcons: Phaser.GameObjects.Text[] = [];
  private missionTexts: Phaser.GameObjects.Text[] = [];
  private currentPointer?: { x: number; y: number };
  private displayedTarget?: number;
  private feedbackBanner?: Phaser.GameObjects.Container;
  private streakBadge?: Phaser.GameObjects.Container;
  private classroomTurnBanner?: Phaser.GameObjects.Container;

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData): void {
    this.resetSceneState();
    this.addBackground();
    const level = data.level ?? LevelManager.getLevel(data.levelId ?? 1);
    const mode = data.mode ?? "campaign";
    this.session = createSession(mode, level, data.classroomState);
    this.ensureClassroomState();
    this.generator = new BoardGenerator({
      availablePrimes: level.availablePrimes,
      seed: Date.now() % 100000,
      ...level.boardTuning,
    });
    this.board = this.generator.createBoard(this.session.currentRemainder);
    this.session.autoShuffleCount = this.generator.shuffleCount;
    this.selection = new SelectionSystem(this.board);
    this.blockers = BlockerSystem.createBlockers(level.obstacles);
    const save = SaveManager.load();
    this.audio.setMuted(save.muted);
    this.audio.setVolume(save.sfxVolume);
    this.audio.setMusicVolume(save.musicVolume);
    this.audio.startMusic(this, PRIME_POP_AUDIO_ASSETS.bgm.key);

    this.drawShell();
    this.drawBoard();
    this.drawBlockers();
    this.updateHud();
    if (this.session.mode === "classroom") {
      this.time.delayedCall(260, () => this.showClassroomTurnAnnouncement());
    }
    this.bindKeyboard();
    this.startTimer();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.cancelDrag, this);
    this.input.on(Phaser.Input.Events.GAME_OUT, this.cancelDrag, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.timerEvent?.remove(false));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.audio.stopMusic());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.cancelDrag, this));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off(Phaser.Input.Events.GAME_OUT, this.cancelDrag, this));
  }

  private resetSceneState(): void {
    this.timerEvent?.remove(false);
    this.timerEvent = undefined;
    this.candyObjects.clear();
    this.blockers = [];
    this.isDragging = false;
    this.inputLocked = false;
    this.isPaused = false;
    this.lastPointerCellKey = undefined;
    this.currentPointer = undefined;
    this.displayedTarget = undefined;
    this.input.keyboard?.off("keydown-ESC");
    this.input.keyboard?.off("keydown-H");
  }

  private drawShell(): void {
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x02061c, 0.24);
    backdrop.fillCircle(boardLayout.centerX, boardLayout.centerY + 12, 470);

    this.addTitleReturnButton();
    this.add
      .image(640, 52, this.getCroppedTexture(PRIME_POP_GAMEPLAY_ASSETS.stageHeaderPanel.key, GAMEPLAY_UI_CROPS.stageHeader))
      .setDisplaySize(390, 76)
      .setAlpha(0.96);
    this.add
      .text(640, 36, `\uC2A4\uD14C\uC774\uC9C0 ${this.session.level.id}`, {
        fontFamily: gameFontFamily,
        fontSize: "16px",
        color: "#bff7ff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 64, (LEVEL_DISPLAY_TITLES[this.session.level.id] ?? this.session.level.title), {
        fontFamily: gameFontFamily,
        fontSize: "25px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const topButtonY = 50;
    const topButtonGap = 10;
    const topButtonHeight = 60;
    const topButtonWidth = 92;
    const musicButtonWidth = 136;
    const fullscreenButtonX = 900;
    const hintButtonX = fullscreenButtonX + topButtonWidth + topButtonGap;
    const pauseButtonX = hintButtonX + topButtonWidth + topButtonGap;
    const musicButtonX = pauseButtonX + topButtonWidth / 2 + topButtonGap + musicButtonWidth / 2 - 18;
    this.addImageButton(fullscreenButtonX, topButtonY, PRIME_POP_BUTTON_ASSETS.fullscreen.key, () => requestFullscreen(), topButtonWidth, topButtonHeight);
    this.addImageButton(hintButtonX, topButtonY, PRIME_POP_BUTTON_ASSETS.hint.key, () => this.useHint(), topButtonWidth, topButtonHeight);
    this.addImageButton(pauseButtonX, topButtonY, PRIME_POP_BUTTON_ASSETS.pause.key, () => this.pauseGame(), topButtonWidth, topButtonHeight);
    this.addMusicToggleButton(musicButtonX, topButtonY, musicButtonWidth);

    this.add
      .image(640, 135, this.getCroppedTexture(PRIME_POP_BOARD_ASSETS.targetPanel.key, GAMEPLAY_UI_CROPS.targetPanel))
      .setDisplaySize(312, 118)
      .setAlpha(0.98);
    this.targetText = this.add
      .text(640, 136, "", {
        fontFamily: gameFontFamily,
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 0, color: "#5be0ff", blur: 10, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .image(640, 212, this.getCroppedTexture(PRIME_POP_GAMEPLAY_ASSETS.factorChainPanel.key, GAMEPLAY_UI_CROPS.factorChain))
      .setDisplaySize(440, 70)
      .setAlpha(0.98)
      .setDepth(12);
    this.equationText = this.add
      .text(640, 210, "", {
        fontFamily: gameFontFamily,
        fontSize: "26px",
        color: "#eaffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(13);
    this.factorsText = this.add
      .text(640, 237, "", {
        fontFamily: gameFontFamily,
        fontSize: "14px",
        color: "#fff4a8",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setAlpha(1)
      .setResolution(2)
      .setDepth(13);

    this.add
      .image(boardLayout.centerX, boardLayout.centerY, PRIME_POP_BOARD_ASSETS.frame.key)
      .setDisplaySize(boardLayout.frameWidth, boardLayout.frameHeight)
      .setAlpha(0.99);
    this.add
      .image(boardLayout.centerX, boardLayout.centerY + 4, PRIME_POP_GAMEPLAY_ASSETS.boardInnerTray.key)
      .setDisplaySize(boardLayout.trayWidth, boardLayout.trayHeight)
      .setAlpha(0.98);

    this.pathLayer = this.add.graphics();
    this.boardLayer = this.add.container(0, 0);
    this.blockerLayer = this.add.container(0, 0);

    this.add
      .image(430, 830, this.getCroppedTexture(PRIME_POP_GAMEPLAY_ASSETS.hudBar.key, GAMEPLAY_UI_CROPS.hudBar))
      .setDisplaySize(610, 112)
      .setAlpha(0.98);
    this.movesText = this.addHudValue(238, 834, "\uB0A8\uC740 \uD130\uCE58", "#ffffff");
    this.timeText = this.addHudValue(430, 834, "\uC2DC\uAC04", "#ffe88c");
    this.scoreText = this.addHudValue(622, 834, "\uC810\uC218", "#ffffff");
    if (this.session.mode === "classroom") {
      this.classroomTurnText = this.add
        .text(640, 286, "", {
          fontFamily: gameFontFamily,
          fontSize: "27px",
          color: "#fff4a8",
          fontStyle: "bold",
          stroke: "#07123d",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setDepth(18);
    }

    this.add
      .image(1010, 836, this.getCroppedTexture(PRIME_POP_GAMEPLAY_ASSETS.missionPanel.key, GAMEPLAY_UI_CROPS.missionPanel))
      .setDisplaySize(460, 82)
      .setAlpha(0.96);
    this.missionIcons = [];
    this.missionTexts = [];
    [
      { x: 862, labelOffset: 24 },
      { x: 1010, labelOffset: 14 },
      { x: 1158, labelOffset: 4 },
    ].forEach(({ x: slotX, labelOffset }) => {
      const icon = this.add
        .text(slotX - 52, 836, "", {
          fontFamily: gameFontFamily,
          fontSize: "16px",
          color: "#ffe88c",
          fontStyle: "bold",
          stroke: "#07123d",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setResolution(2);
      const label = this.add
        .text(slotX + labelOffset, 836, "", {
          fontFamily: gameFontFamily,
          fontSize: "13px",
          color: "#ffffff",
          fontStyle: "bold",
          stroke: "#07123d",
          strokeThickness: 2,
          align: "center",
          wordWrap: { width: 106, useAdvancedWrap: true },
        })
        .setOrigin(0.5)
        .setResolution(2)
        .setLineSpacing(0);
      this.missionIcons.push(icon);
      this.missionTexts.push(label);
    });

    this.comboText = this.add.text(0, 0, "").setVisible(false);

    this.tweens.add({ targets: [this.targetText, this.equationText], alpha: { from: 0, to: 1 }, y: "+=0", duration: 220 });
    this.boardLayer.setAlpha(0);
    this.tweens.add({ targets: this.boardLayer, alpha: 1, y: "-=6", duration: 240, ease: "Sine.easeOut" });
  }

  private addTitleReturnButton(): void {
    const x = 116;
    const y = 50;
    const key = this.getCroppedTexture(PRIME_POP_WORLD_MAP_ASSETS.backToTitle.key, GAMEPLAY_UI_CROPS.backToTitle);
    const button = this.add.image(x, y, key).setDisplaySize(166, 60).setDepth(80);
    const baseScaleX = button.scaleX;
    const baseScaleY = button.scaleY;
    const hitZone = this.add.zone(x, y, 184, 76).setDepth(81);
    const setButtonScale = (scale: number, duration: number): void => {
      this.tweens.killTweensOf(button);
      this.tweens.add({
        targets: button,
        scaleX: baseScaleX * scale,
        scaleY: baseScaleY * scale,
        duration,
        ease: "Sine.easeOut",
      });
    };

    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on("pointerover", () => setButtonScale(1.03, 150));
    hitZone.on("pointerout", () => setButtonScale(1, 150));
    hitZone.on("pointerdown", () => {
      setButtonScale(0.96, 70);
      this.scene.start("MenuScene");
    });
  }

  private addImageButton(
    x: number,
    y: number,
    key: string,
    onClick: () => void,
    width: number,
    height: number,
  ): Phaser.GameObjects.Image {
    const button = this.add.image(x, y, key);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const fit = Math.min(width / source.width, height / source.height);
    button.setScale(fit).setInteractive({ useHandCursor: true });
    button.on("pointerover", () => this.tweens.add({ targets: button, scale: fit * 1.03, duration: 120, ease: "Sine.easeOut" }));
    button.on("pointerout", () => this.tweens.add({ targets: button, scale: fit, duration: 120, ease: "Sine.easeOut" }));
    button.on("pointerdown", () => {
      this.tweens.add({ targets: button, scale: fit * 0.96, duration: 80, yoyo: true, ease: "Sine.easeOut" });
      onClick();
    });
    return button;
  }

  private addHudValue(x: number, y: number, label: string, color: string): Phaser.GameObjects.Text {
    this.add
      .text(x, y - 18, label, {
        fontFamily: gameFontFamily,
        fontSize: "15px",
        color: "#dffbff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setResolution(2);
    return this.add
      .text(x, y + 10, "", {
        fontFamily: gameFontFamily,
        fontSize: "29px",
        color,
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setResolution(2);
  }

  private addMusicToggleButton(x: number, y: number, displayWidth: number): void {
    const image = this.add.image(x, y, this.musicToggleKey()).setDepth(80);
    let scale = this.applyMusicToggleTexture(image, displayWidth);
    const hitZone = this.add.zone(x, y, displayWidth + 10, 58).setDepth(81);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on("pointerover", () => this.tweens.add({ targets: image, scale: scale * 1.03, duration: 110, ease: "Sine.easeOut" }));
    hitZone.on("pointerout", () => {
      this.tweens.add({ targets: image, scale, duration: 110, ease: "Sine.easeOut" });
    });
    hitZone.on("pointerdown", () => {
      this.tweens.add({ targets: image, scale: scale * 0.96, duration: 70, ease: "Sine.easeOut" });
    });
    hitZone.on("pointerup", () => {
      const next = SaveManager.update((data) => ({ ...data, muted: !data.muted }));
      this.audio.setMuted(next.muted);
      if (!next.muted) this.audio.startMusic(this, PRIME_POP_AUDIO_ASSETS.bgm.key);
      scale = this.applyMusicToggleTexture(image, displayWidth);
    });
  }

  private applyMusicToggleTexture(image: Phaser.GameObjects.Image, displayWidth: number): number {
    const key = this.musicToggleKey();
    image.setTexture(key);
    image.setName(SaveManager.load().muted ? "음악 켜기" : "음악 끄기");
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const scale = displayWidth / source.width;
    image.setScale(scale);
    return scale;
  }

  private musicToggleKey(): string {
    return SaveManager.load().muted ? PRIME_POP_BUTTON_ASSETS.musicOn.key : PRIME_POP_BUTTON_ASSETS.musicOff.key;
  }

  private pulseText(text: Phaser.GameObjects.Text): void {
    this.tweens.add({ targets: text, scale: 1.08, duration: 90, yoyo: true, ease: "Back.easeOut" });
  }

  private drawBoard(): void {
    this.boardLayer.removeAll(true);
    this.candyObjects.clear();
    const rows = gameConfig.board.rows;
    const columns = gameConfig.board.columns;
    const maxTileByWidth = Math.floor((boardLayout.trayWidth - boardLayout.trayPaddingX * 2) / (columns + (columns - 1) * 0.2));
    const maxTileByHeight = Math.floor((boardLayout.trayHeight - boardLayout.trayPaddingY * 2) / (rows + (rows - 1) * 0.2));
    this.cellSize = Math.min(74, maxTileByWidth, maxTileByHeight);
    const gapX = Math.max(8, Math.round(this.cellSize * 0.18));
    const gapY = Math.max(3, Math.round(this.cellSize * 0.045));
    boardLayout.gapX = gapX;
    boardLayout.gapY = gapY;
    const gridWidth = this.cellSize * columns + gapX * (columns - 1);
    const gridHeight = this.cellSize * rows + gapY * (rows - 1);
    this.boardX = Math.round(boardLayout.centerX - gridWidth / 2);
    this.boardY = Math.round(boardLayout.centerY + 12 - gridHeight / 2);

    for (const row of this.board) {
      for (const candy of row) {
        if (!candy) continue;
        const { x, y } = this.cellCenter(candy.row, candy.col);
        const container = this.add.container(x, y);
        const tileKey = primeTileKey(candy.prime);
        const tileSize = Math.round(this.cellSize * 0.92);
        const highlight = this.add
          .image(0, 0, PRIME_POP_BOARD_ASSETS.selectionHighlight.key)
          .setDisplaySize(Math.round(tileSize * 1.2), Math.round(tileSize * 1.2))
          .setVisible(false)
          .setAlpha(0.82);
        highlight.setName("highlight");
        this.tweens.add({
          targets: highlight,
          alpha: 1,
          scaleX: highlight.scaleX * 1.04,
          scaleY: highlight.scaleY * 1.04,
          duration: 430,
          yoyo: true,
          repeat: -1,
        });
        const image = this.add.image(0, 0, tileKey).setDisplaySize(tileSize, tileSize);
        image.setName("tile");
        const children: Phaser.GameObjects.GameObject[] = [highlight, image];
        const fallbackKeys = (this.registry.get("fallbackCandyKeys") as string[] | undefined) ?? [];
        if (!PRIME_TILE_ASSETS[candy.prime] || fallbackKeys.includes(tileKey)) {
          children.push(
            this.add
              .text(0, 1, String(candy.prime), {
                fontFamily: gameFontFamily,
                fontSize: `${Math.floor(this.cellSize * 0.42)}px`,
                color: "#ffffff",
                fontStyle: "bold",
                stroke: "#162044",
                strokeThickness: 5,
              })
              .setOrigin(0.5),
          );
        }
        const special = candy.special
          ? this.add
              .text(0, -this.cellSize * 0.34, candy.special === "exponentBomb" ? "\uC9C0\uC218" : "\uB85C\uCF13", {
                fontFamily: gameFontFamily,
                fontSize: "15px",
                color: "#fff6a8",
                stroke: "#162044",
                strokeThickness: 3,
              })
              .setOrigin(0.5)
          : undefined;
        container.add(children);
        if (special) container.add(special);
        container.setSize(this.cellSize, this.cellSize);
        container.setInteractive({ useHandCursor: true });
        container.on("pointerover", () => {
          if (!this.inputLocked) this.tweens.add({ targets: container, scale: 1.04, duration: 110, ease: "Sine.easeOut" });
        });
        container.on("pointerout", () => {
          if (!this.inputLocked) this.tweens.add({ targets: container, scale: 1, duration: 110, ease: "Sine.easeOut" });
        });
        container.on("pointerdown", () => {
          if (!this.inputLocked) this.tweens.add({ targets: container, scale: 0.96, duration: 70, yoyo: true, ease: "Sine.easeOut" });
        });
        this.boardLayer.add(container);
        this.candyObjects.set(candy.id, container);
      }
    }
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.off("pointermove", this.handlePointerMove, this);
    this.input.off("pointerup", this.endDrag, this);
    this.input.off("pointerupoutside", this.endDrag, this);
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerup", this.endDrag, this);
    this.input.on("pointerupoutside", this.endDrag, this);
  }
  private drawBlockers(): void {
    this.blockerLayer.removeAll(true);
    for (const blocker of this.blockers) {
      const { x, y } = this.cellCenter(blocker.row, blocker.col);
      const container = this.add.container(x, y);
      const size = this.cellSize * 0.82;
      const plate = this.add
        .rectangle(0, 0, size, size, blocker.type === "compositeIce" ? 0x9defff : 0x231a63, blocker.type === "compositeIce" ? 0.72 : 0.82)
        .setStrokeStyle(3, blocker.type === "compositeIce" ? 0xffffff : 0xffd761, 0.9);

      if (blocker.type === "compositeIce") {
        const frost = this.add.rectangle(0, 0, size * 0.72, size * 0.72, 0xeaffff, 0.26).setStrokeStyle(2, 0x75ecff, 0.8);
        const text = this.add
          .text(0, 1, String(blocker.current), {
            fontFamily: gameFontFamily,
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#194c78",
            strokeThickness: 5,
          })
          .setOrigin(0.5);
        container.add([plate, frost, text]);
      } else {
        const requiredEntries = Object.entries(blocker.required);
        const requiredTotal = requiredEntries.reduce((sum, [, count]) => sum + (count ?? 0), 0);
        const usedTotal = requiredEntries.reduce((sum, [prime]) => sum + (blocker.used[Number(prime) as Prime] ?? 0), 0);
        const requiredLabel = requiredEntries
          .flatMap(([prime, count]) => Array.from({ length: count ?? 0 }, () => prime))
          .join("·");
        const lock = this.add.image(0, -5, PRIME_POP_WORLD_MAP_ASSETS.lockIcon.key).setDisplaySize(size * 0.54, size * 0.54).setAlpha(0.96);
        const progress = this.add
          .text(0, size * 0.23, `${usedTotal}/${requiredTotal}`, {
            fontFamily: gameFontFamily,
            fontSize: "13px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#07123d",
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        const required = this.add
          .text(0, -size * 0.36, requiredLabel, {
            fontFamily: gameFontFamily,
            fontSize: "10px",
            color: "#ffe88c",
            fontStyle: "bold",
            stroke: "#07123d",
            strokeThickness: 3,
          })
          .setOrigin(0.5);
        container.add([plate, lock, progress, required]);
      }
      this.blockerLayer.add(container);
    }
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.isPaused || this.session.timeLeftSeconds <= 0) return;
        this.session.timeLeftSeconds -= 1;
        if (this.session.timeLeftSeconds <= 0) {
          this.timeUp();
          return;
        }
        this.updateHud();
      },
    });
  }

  private timeUp(): void {
    this.inputLocked = true;
    this.isDragging = false;
    this.showRetryFeedback("\uC2DC\uAC04 \uC885\uB8CC!");
    this.audio.play("fail");
    this.time.delayedCall(450, () => this.finishGame());
  }

  private beginDrag(candy: Candy): void {
    if (this.inputLocked) return;
    this.audio.play("select");
    this.isDragging = true;
    this.lastPointerCellKey = `${candy.row}:${candy.col}`;
    this.selection.clear();
    this.extendDrag(candy);
  }

  private extendDrag(candy: Candy): void {
    if (!this.isDragging || this.inputLocked) return;
    const before = this.selection.getState(this.session.currentRemainder).candies.length;
    const state = this.selection.tryAdd(candy.row, candy.col, this.session.currentRemainder);
    const after = state.candies.length;
    if (after > before) {
      this.audio.play("chain", after);
      this.animateSelected(candy.id);
      if (navigator.vibrate) navigator.vibrate(12);
    } else if (state.invalidMessage) {
      this.audio.play("invalid");
      this.shakeCandy(candy.id);
      this.session.invalidSelections += 1;
      this.breakCombo();
      if (!this.isDivisibilityHint(state.invalidMessage)) {
        this.showRetryFeedback(state.invalidMessage || "\uB2E4\uC2DC \uC120\uD0DD!");
      }
    }
    this.drawPath(state.candies);
    this.previewSelection(state);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.inputLocked) return;
    this.currentPointer = { x: pointer.x, y: pointer.y };
    const cell = this.pointerToCell(pointer.x, pointer.y);
    if (!cell) {
      this.drawPath(this.selection.getState(this.session.currentRemainder).candies);
      return;
    }
    const cellKey = `${cell.row}:${cell.col}`;
    if (cellKey === this.lastPointerCellKey) return;
    this.lastPointerCellKey = cellKey;
    const candy = this.board[cell.row]?.[cell.col] ?? null;
    if (candy) this.extendDrag(candy);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.inputLocked) return;
    this.currentPointer = { x: pointer.x, y: pointer.y };
    const cell = this.pointerToCell(pointer.x, pointer.y);
    if (!cell) return;
    const candy = this.board[cell.row]?.[cell.col] ?? null;
    if (!candy) return;
    if (!FactorizationEngine.canDivide(this.session.currentRemainder, candy.prime) && this.canHitAdjacentBlocker(candy)) {
      this.commitObstacleOnlySelection(candy);
      return;
    }
    if (this.session.mode === "classroom" && !FactorizationEngine.canDivide(this.session.currentRemainder, candy.prime)) {
      this.commitInvalidClassroomClick(candy);
      return;
    }
    this.beginDrag(candy);
  }

  private endDrag(): void {
    if (!this.isDragging || this.inputLocked) return;
    this.isDragging = false;
    const state = this.selection.getState(this.session.currentRemainder);
    if (state.factors.length === 0) {
      this.selection.clear();
      this.pathLayer.clear();
      this.lastPointerCellKey = undefined;
      return;
    }
    this.lastPointerCellKey = undefined;
    this.currentPointer = undefined;
    this.commitSelection(state.candies, state.factors);
  }

  private commitSelection(candies: Candy[], factors: Prime[]): void {
    const result = FactorizationEngine.applyFactors(this.session.currentRemainder, factors);
    if (!result.ok) {
      this.breakCombo();
      if (!this.isDivisibilityHint(result.message)) {
        this.showRetryFeedback(result.message || "\uB2E4\uC2DC \uC120\uD0DD!");
      }
      this.audio.play("invalid");
      this.session.invalidSelections += 1;
      if (this.session.mode === "classroom" || this.session.level.wrongDragPenalty) this.session.movesLeft = Math.max(0, this.session.movesLeft - 1);
      this.advanceClassroomTurn();
      if (this.session.movesLeft <= 0) {
        this.finishGame();
        return;
      }
      this.updateHud();
      return;
    }
    this.inputLocked = true;
    const score = ScoreSystem.scoreSelection(this.session, factors, result.completed);
    this.applyScore(score);
    if (this.session.mode !== "classroom") this.session.combo += 1;
    this.session.currentTargetDragCount += 1;
    for (const factor of factors) {
      this.session.collectedPrimes[factor] = (this.session.collectedPrimes[factor] ?? 0) + 1;
    }
    const longChainGoal = this.session.level.objectives.longChainLength ?? 4;
    if (factors.length >= longChainGoal) {
      this.session.longChainsCompleted += 1;
    }
    this.session.movesLeft -= 1;
    this.session.correctSelections += factors.length;
    this.session.longestChain = Math.max(this.session.longestChain, factors.length);
    this.session.selectedFactors.push(...factors);
    this.session.currentRemainder = result.remainder;

    let obstacleDamaged = 0;
    let obstacleCleared = 0;
    const blockerMessages: string[] = [];
    for (const candy of candies) {
      const hit = BlockerSystem.hitAdjacent(this.blockers, candy.row, candy.col, candy.prime);
      obstacleDamaged += hit.damaged.length;
      obstacleCleared += hit.cleared.length;
      blockerMessages.push(...hit.messages);
    }
    const obstacleScore = ScoreSystem.scoreObstacleHits(obstacleDamaged, obstacleCleared);
    this.applyScore(obstacleScore);

    this.blockers = this.blockers.filter((blocker) => {
      if (blocker.type === "compositeIce") return blocker.current > 1;
      return !Object.entries(blocker.required).every(([key, count]) => {
        const prime = Number(key) as Prime;
        return (blocker.used[prime] ?? 0) >= (count ?? 0);
      });
    });

    const specialAward = this.session.level.specialsEnabled ? SpecialCandySystem.evaluate(factors, result.completed) : {};
    const extraCandies = this.getSpecialExtraCandies(candies);
    const uniqueExtras = extraCandies.filter((extra) => !candies.some((candy) => candy.id === extra.id));
    const specialScore = ScoreSystem.scoreSpecialClears(uniqueExtras.length);
    this.applyScore(specialScore);

    const totalGained = this.visibleScoreGain(score) + this.visibleScoreGain(obstacleScore) + this.visibleScoreGain(specialScore);
    const labels = [...score.labels, ...obstacleScore.labels, ...specialScore.labels];
    if (specialAward.label) labels.push(specialAward.label);
    if (blockerMessages[0]) labels.push(blockerMessages[0]);
    this.factorsText.setText(`${labels.join("  ")}  +${totalGained}`);
    this.floatScore(candies, totalGained, factors.length);

    const candiesToRemove = [...candies, ...uniqueExtras];
    this.popCandies(candiesToRemove, () => {
      this.generator.remove(this.board, candiesToRemove.map((candy) => candy.id));
      this.generator.refill(this.board, this.session.currentRemainder);
      if (specialAward.special) this.placeSpecialCandy(specialAward.special);
      this.session.autoShuffleCount = this.generator.shuffleCount;
      this.selection = new SelectionSystem(this.board);
      this.pathLayer.clear();
      this.drawBoard();
      this.drawBlockers();
      if (this.session.timeLeftSeconds <= 0) {
        this.timeUp();
      } else if (result.completed) {
        this.advanceClassroomTurn();
        this.advanceTargetOrFinish();
      } else if (this.session.movesLeft <= 0) {
        this.advanceClassroomTurn();
        this.finishGame();
      } else {
        this.advanceClassroomTurn();
        this.inputLocked = false;
        this.updateHud();
      }
    });
  }

  private canHitAdjacentBlocker(candy: Candy): boolean {
    return this.blockers.some((blocker) => {
      const distance = Math.abs(blocker.row - candy.row) + Math.abs(blocker.col - candy.col);
      if (distance > 1) return false;
      if (blocker.type === "compositeIce") return FactorizationEngine.canDivide(blocker.current, candy.prime);
      const need = blocker.required[candy.prime] ?? 0;
      const used = blocker.used[candy.prime] ?? 0;
      return used < need;
    });
  }

  private commitObstacleOnlySelection(candy: Candy): void {
    this.inputLocked = true;
    this.isDragging = false;
    this.selection.clear();
    this.pathLayer.clear();
    this.lastPointerCellKey = undefined;
    this.currentPointer = undefined;

    const hit = BlockerSystem.hitAdjacent(this.blockers, candy.row, candy.col, candy.prime);
    const obstacleScore = ScoreSystem.scoreObstacleHits(hit.damaged.length, hit.cleared.length);
    this.applyScore(obstacleScore);
    this.session.movesLeft -= 1;
    this.session.collectedPrimes[candy.prime] = (this.session.collectedPrimes[candy.prime] ?? 0) + 1;

    this.blockers = this.blockers.filter((blocker) => {
      if (blocker.type === "compositeIce") return blocker.current > 1;
      return !Object.entries(blocker.required).every(([key, count]) => {
        const prime = Number(key) as Prime;
        return (blocker.used[prime] ?? 0) >= (count ?? 0);
      });
    });

    const labels = [...obstacleScore.labels, ...hit.messages];
    const obstacleGained = this.visibleScoreGain(obstacleScore);
    this.factorsText.setText(`${labels.join("  ")}  +${obstacleGained}`);
    this.floatScore([candy], obstacleGained, 1);
    this.popCandies([candy], () => {
      this.generator.remove(this.board, [candy.id]);
      this.generator.refill(this.board, this.session.currentRemainder);
      this.selection = new SelectionSystem(this.board);
      this.drawBoard();
      this.drawBlockers();
      if (this.session.movesLeft <= 0) {
        this.advanceClassroomTurn();
        this.finishGame();
        return;
      }
      this.advanceClassroomTurn();
      this.inputLocked = false;
      this.updateHud();
    });
  }

  private commitInvalidClassroomClick(candy: Candy): void {
    this.inputLocked = true;
    this.isDragging = false;
    this.selection.clear();
    this.pathLayer.clear();
    this.lastPointerCellKey = undefined;
    this.currentPointer = undefined;
    this.session.invalidSelections += 1;
    this.session.movesLeft = Math.max(0, this.session.movesLeft - 1);
    this.breakCombo();
    this.audio.play("invalid");
    this.shakeCandy(candy.id);

    this.time.delayedCall(420, () => {
      if (this.session.movesLeft <= 0) {
        this.advanceClassroomTurn();
        this.finishGame();
        return;
      }
      this.advanceClassroomTurn();
      this.inputLocked = false;
      this.updateHud();
    });
  }

  private applyScore(result: ReturnType<typeof ScoreSystem.scoreSelection>, awardToClassroomTeam = true): void {
    const gained = this.visibleScoreGain(result);
    this.session.score += gained;
    if (awardToClassroomTeam && result.gained > 0 && this.session.mode === "classroom" && this.session.classroomState) {
      const teamIndex = this.session.classroomState.currentTeamIndex;
      this.session.classroomState.scores[teamIndex] = (this.session.classroomState.scores[teamIndex] ?? 0) + gained;
    }
    ScoreSystem.mergeBreakdown(this.session.scoreBreakdown, result.parts);
  }

  private visibleScoreGain(result: ReturnType<typeof ScoreSystem.scoreSelection>): number {
    if (this.session.mode !== "classroom") return result.gained;
    const parts = result.parts;
    return parts.chain + parts.exponent + parts.longChain + parts.perfect + parts.obstacle + parts.special;
  }

  private ensureClassroomState(): void {
    if (this.session.mode !== "classroom") return;
    const state = this.session.classroomState ?? {
      teams: ["A팀", "B팀"],
      scores: [0, 0],
      currentTeamIndex: 0,
      round: 1,
    };
    const teams = state.teams.length >= 2 ? state.teams.slice(0, 2) : ["A팀", "B팀"];
    this.session.classroomState = {
      teams,
      scores: teams.map((_, index) => Math.max(0, state.scores[index] ?? 0)),
      currentTeamIndex: Math.max(0, Math.min(teams.length - 1, state.currentTeamIndex)),
      round: Math.max(1, state.round),
    };
  }

  private advanceClassroomTurn(): void {
    const state = this.session.classroomState;
    if (this.session.mode !== "classroom" || !state) return;
    state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
    if (state.currentTeamIndex === 0) state.round += 1;
    this.showClassroomTurnAnnouncement();
  }

  private breakCombo(): void {
    if (this.session.combo <= 0) return;
    this.session.combo = 0;
    this.updateHud();
  }

  private placeSpecialCandy(special: SpecialCandy): void {
    const candidates = this.board.flat().filter((cell): cell is Candy => Boolean(cell));
    const candidate = candidates[Math.floor(candidates.length / 2)] ?? candidates[0];
    if (!candidate) return;
    candidate.special = special;
    this.audio.play("special");
  }

  private getSpecialExtraCandies(candies: Candy[]): Candy[] {
    const extras: Candy[] = [];
    for (const candy of candies) {
      if (!candy.special) continue;
      if (candy.special === "rocketH") {
        extras.push(...this.board[candy.row]!.filter((cell): cell is Candy => Boolean(cell)));
      } else if (candy.special === "rocketV") {
        extras.push(...this.board.map((row) => row[candy.col]).filter((cell): cell is Candy => Boolean(cell)));
      } else if (candy.special === "exponentBomb") {
        for (let row = candy.row - 1; row <= candy.row + 1; row += 1) {
          for (let col = candy.col - 1; col <= candy.col + 1; col += 1) {
            const cell = this.board[row]?.[col] ?? null;
            if (cell) extras.push(cell);
          }
        }
      }
    }
    return extras;
  }

  private advanceTargetOrFinish(): void {
    this.audio.play("complete");
    this.session.completedTargets += 1;
    if (this.session.currentTargetDragCount === 1) {
      this.session.perfectTargetCount += 1;
    }
    const dragGoal = this.session.level.objectives.maxDragsPerTarget;
    if (dragGoal && this.session.currentTargetDragCount <= dragGoal) {
      this.session.targetsCompletedWithinDragGoal += 1;
    }
    const factors = [...this.session.selectedFactors];
    const canonical = FactorizationEngine.formatCanonical(this.session.originalTarget);
    this.session.completedFactorizations.push({
      target: this.session.originalTarget,
      factors,
      canonical,
    });
    this.equationText.setText(`${factors.join(" \u00D7 ")} = ${this.session.originalTarget}`);
    this.popFactorChain();
    this.showSuccessFeedback("\uBD84\uD574 \uC131\uACF5!");
    this.playSuccessEffect();
    this.showStreakBadge();
    const nextTarget = this.session.level.targets[this.session.targetIndex + 1];
    if (!nextTarget) {
      this.time.delayedCall(820, () => this.finishGame());
      return;
    }
    this.time.delayedCall(760, () => {
      this.session.targetIndex += 1;
      this.session.originalTarget = nextTarget;
      this.session.currentRemainder = nextTarget;
      this.session.selectedFactors = [];
      this.session.currentTargetDragCount = 0;
      this.generator.ensureValidMove(this.board, nextTarget);
      this.inputLocked = false;
      this.updateHud();
    });
  }

  private popCandies(candies: Candy[], onComplete: () => void): void {
    let remaining = candies.length;
    for (const candy of candies) {
      const object = this.candyObjects.get(candy.id);
      if (!object) {
        remaining -= 1;
        continue;
      }
      this.time.delayedCall(120, () => this.emitPopVfx(candy));
      this.tweens.add({
        targets: object,
        scale: 1.12,
        duration: 90,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: object,
            scale: 0.9,
            duration: 70,
            ease: "Sine.easeInOut",
            onComplete: () => {
              this.audio.play("pop");
              this.tweens.add({
                targets: object,
                scale: 0,
                alpha: 0,
                duration: 210,
                ease: "Back.easeIn",
                onComplete: () => {
                  remaining -= 1;
                  if (remaining === 0) onComplete();
                },
              });
            },
          });
        },
      });
    }
    if (candies.length === 0) onComplete();
  }

  private animateSelected(id: string): void {
    const object = this.candyObjects.get(id);
    if (!object) return;
    this.tweens.add({ targets: object, scale: 1.13, duration: 80, yoyo: true });
  }

  private shakeCandy(id: string): void {
    const object = this.candyObjects.get(id);
    if (!object) return;
    this.tweens.add({ targets: object, x: object.x + 8, duration: 45, yoyo: true, repeat: 2 });
  }

  private drawPath(candies: readonly Candy[]): void {
    this.pathLayer.clear();
    this.setSelectionVisuals(candies);
    if (candies.length < 1) return;
    this.pathLayer.lineStyle(18, 0xffffff, 0.18);
    this.pathLayer.beginPath();
    candies.forEach((candy, index) => {
      const { x, y } = this.cellCenter(candy.row, candy.col);
      if (index === 0) this.pathLayer.moveTo(x, y);
      else this.pathLayer.lineTo(x, y);
    });
    if (this.currentPointer && candies.length > 0) {
      this.pathLayer.lineTo(this.currentPointer.x, this.currentPointer.y);
    }
    this.pathLayer.strokePath();
    this.pathLayer.lineStyle(9, 0x5be0ff, 0.92);
    this.pathLayer.beginPath();
    candies.forEach((candy, index) => {
      const { x, y } = this.cellCenter(candy.row, candy.col);
      if (index === 0) this.pathLayer.moveTo(x, y);
      else this.pathLayer.lineTo(x, y);
    });
    if (this.currentPointer && candies.length > 0) {
      this.pathLayer.lineTo(this.currentPointer.x, this.currentPointer.y);
    }
    this.pathLayer.strokePath();
  }

  private setSelectionVisuals(candies: readonly Candy[]): void {
    const selectedIds = new Set(candies.map((candy) => candy.id));
    for (const [id, object] of this.candyObjects) {
      const highlight = object.getByName("highlight") as Phaser.GameObjects.Image | null;
      const selected = selectedIds.has(id);
      highlight?.setVisible(selected);
      if (!this.inputLocked) object.setScale(selected ? 1.05 : 1);
    }
  }

  private previewSelection(state: { factors: Prime[]; previewRemainder: number }): void {
    const all = [...this.session.selectedFactors, ...state.factors];
    const expression = all.length > 0 ? all.join(" \u00D7 ") : "\uC120\uD0DD \uB300\uAE30";
    this.equationText.setText(expression);
    this.factorsText.setText(all.length > 0 ? all.join(" \u00D7 ") : "");
    if (state.factors.length > 0) this.popFactorChain();
  }

  private updateHud(): void {
    const previousMoves = this.movesText.text;
    const previousTime = this.timeText.text;
    const previousScore = this.scoreText.text;

    this.targetText.setText(String(this.session.originalTarget));
    if (this.displayedTarget !== this.session.originalTarget) {
      this.displayedTarget = this.session.originalTarget;
      this.targetText.setScale(0.92);
      this.tweens.add({ targets: this.targetText, scale: 1.05, duration: 160, yoyo: true, ease: "Back.easeOut" });
    }
    this.movesText.setText(String(this.session.movesLeft));
    this.timeText.setText(this.formatTime(this.session.timeLeftSeconds));
    this.timeText.setColor(this.session.timeLeftSeconds <= 15 ? "#ff6c83" : "#ffe88c");
    this.scoreText.setText(String(this.session.score));
    this.updateClassroomTurnText();
    if (previousMoves && previousMoves !== this.movesText.text) this.pulseText(this.movesText);
    if (previousTime && previousTime !== this.timeText.text) this.pulseText(this.timeText);
    if (previousScore && previousScore !== this.scoreText.text) this.pulseText(this.scoreText);

    this.comboText.setText(`\uC5F0\uC18D ${this.session.combo}`);
    this.updateMissionSlots();
    const selected = this.session.selectedFactors;
    this.factorsText.setText(
      selected.length > 0 ? selected.join(" \u00D7 ") : "\uD55C \uBC88\uC5D0 \uAE38\uAC8C \uC5F0\uACB0\uD560\uC218\uB85D \uBCF4\uB108\uC2A4",
    );
    this.equationText.setText(selected.length > 0 ? selected.join(" \u00D7 ") : "\uC120\uD0DD \uB300\uAE30");
  }

  private updateClassroomTurnText(): void {
    const state = this.session.classroomState;
    if (!this.classroomTurnText || this.session.mode !== "classroom" || !state) return;
    this.classroomTurnText.setText(`${state.teams[0]} ${state.scores[0]} : ${state.teams[1]} ${state.scores[1]}`);
  }

  private showClassroomTurnAnnouncement(): void {
    const state = this.session.classroomState;
    if (this.session.mode !== "classroom" || !state) return;
    this.classroomTurnBanner?.destroy();
    const team = state.teams[state.currentTeamIndex] ?? "A팀";
    const isTeamA = state.currentTeamIndex === 0;
    const container = this.add.container(640, 360).setDepth(120).setAlpha(0).setScale(0.78);
    const panel = this.add.graphics();
    panel.fillStyle(isTeamA ? 0x123a8f : 0x5b238d, 0.92);
    panel.fillRoundedRect(-300, -96, 600, 192, 34);
    panel.lineStyle(5, isTeamA ? 0xffe48a : 0x85f1ff, 0.96);
    panel.strokeRoundedRect(-300, -96, 600, 192, 34);
    panel.fillStyle(0xffffff, 0.14);
    panel.fillRoundedRect(-260, -74, 520, 42, 22);
    const roundText = this.add
      .text(0, -44, `${state.round}라운드`, {
        fontFamily: gameFontFamily,
        fontSize: "30px",
        color: "#fff4a8",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setResolution(2);
    const turnText = this.add
      .text(0, 24, `${team} 차례!`, {
        fontFamily: gameFontFamily,
        fontSize: "62px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 0, color: isTeamA ? "#ffdc6c" : "#72eaff", blur: 12, fill: true },
      })
      .setOrigin(0.5)
      .setResolution(2);
    container.add([panel, roundText, turnText]);
    this.classroomTurnBanner = container;
    this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.time.delayedCall(980, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        scale: 0.92,
        duration: 180,
        ease: "Sine.easeIn",
        onComplete: () => {
          if (this.classroomTurnBanner === container) this.classroomTurnBanner = undefined;
          container.destroy();
        },
      });
    });
  }

  private showResultFeedback(key: string, message: string, retry = false): void {
    this.feedbackBanner?.destroy();
    const container = this.add.container(boardLayout.centerX, boardLayout.centerY - 12).setDepth(90).setAlpha(0).setScale(0.76);
    const banner = this.add.image(0, 0, key).setDisplaySize(390, 150).setAlpha(0.98);
    const text = this.add
      .text(0, 2, message, {
        fontFamily: gameFontFamily,
        fontSize: "34px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    container.add([banner, text]);
    this.feedbackBanner = container;
    this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 190, ease: "Back.easeOut" });
    if (retry) {
      this.tweens.add({ targets: container, x: boardLayout.centerX + 5, duration: 55, yoyo: true, repeat: 3, ease: "Sine.easeInOut" });
    }
    this.time.delayedCall(retry ? 620 : 860, () => {
      this.tweens.add({ targets: container, alpha: 0, scale: 0.94, duration: 180, ease: "Sine.easeIn", onComplete: () => container.destroy() });
    });
  }

  private showSuccessFeedback(message: string): void {
    this.showResultFeedback(PRIME_POP_GAMEPLAY_ASSETS.feedbackSuccess.key, message, false);
  }

  private showRetryFeedback(message = "\uB2E4\uC2DC \uC120\uD0DD!"): void {
    this.showResultFeedback(PRIME_POP_GAMEPLAY_ASSETS.feedbackRetry.key, message, true);
  }

  private isDivisibilityHint(message?: string): boolean {
    return Boolean(message && message.includes("\uD604\uC7AC \uC218") && message.includes("\uB098\uB20C \uC218 \uC5C6\uC5B4\uC694"));
  }

  private popFactorChain(): void {
    this.tweens.killTweensOf(this.equationText);
    this.equationText.setScale(0.86);
    this.tweens.add({ targets: this.equationText, scale: 1, duration: 150, ease: "Back.easeOut" });
  }

  private showStreakBadge(): void {
    if (this.session.mode === "classroom") return;
    if (this.session.combo < 2) return;
    this.streakBadge?.destroy();
    const container = this.add.container(902, 214).setDepth(88).setAlpha(0).setScale(0.7);
    const badge = this.add.image(0, 0, PRIME_POP_GAMEPLAY_ASSETS.streakBadge.key).setDisplaySize(190, 86).setAlpha(0.98);
    const text = this.add
      .text(0, 0, `\uC5F0\uC18D \uC131\uACF5 ${this.session.combo}\uD68C!`, {
        fontFamily: gameFontFamily,
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    container.add([badge, text]);
    this.streakBadge = container;
    this.tweens.add({ targets: container, alpha: 1, scale: 1.0, duration: 250, ease: "Back.easeOut" });
    this.time.delayedCall(1050, () => {
      this.tweens.add({ targets: container, alpha: 0, duration: 200, ease: "Sine.easeIn", onComplete: () => container.destroy() });
    });
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  private updateMissionSlots(): void {
    const lines = this.formatMissionProgress();
    this.missionTexts.forEach((text, index) => {
      const line = lines[index] ?? "";
      const complete = line.startsWith("✓");
      const marker = line ? (complete ? "✓" : "•") : "";
      this.missionIcons[index]?.setText(marker);
      this.missionIcons[index]?.setColor(complete ? "#9dffcf" : "#ffe88c");
      text.setText(line.replace(/^[✓•]\s*/, ""));
      text.setAlpha(line ? 1 : 0);
      this.missionIcons[index]?.setAlpha(line ? 1 : 0);
    });
  }

  private formatMissionProgress(): string[] {
    const objectives = this.session.level.objectives;
    const lines: string[] = [];
    if (objectives.maxDragsPerTarget) {
      const done = this.session.targetsCompletedWithinDragGoal;
      const total = this.session.level.targets.length;
      lines.push(`${done >= total ? "\u2713" : "\u2022"} \uBAA9\uD45C\uB2F9 ${objectives.maxDragsPerTarget}\uBC88 \uC774\uD558\n${done}/${total}`);
    }
    if (objectives.minLongChains) {
      const done = this.session.longChainsCompleted;
      const total = objectives.minLongChains;
      lines.push(`${done >= total ? "\u2713" : "\u2022"} ${objectives.longChainLength ?? 4}\uAC1C \uC774\uC0C1 \uC5F0\uACB0\n${done}/${total}`);
    }
    if (objectives.collectPrimes) {
      for (const [prime, required] of Object.entries(objectives.collectPrimes).slice(0, Math.max(1, 3 - lines.length))) {
        const done = this.session.collectedPrimes[Number(prime) as Prime] ?? 0;
        lines.push(`${done >= (required ?? 0) ? "\u2713" : "\u2022"} ${prime} \uBCF4\uC11D \uBAA8\uC73C\uAE30\n${done}/${required}`);
      }
    }
    return lines.length > 0 ? lines.slice(0, 3) : ["\u2022 \uBAA9\uD45C \uC22B\uC790 \uBD84\uD574"];
  }
  private finishGame(): void {
    this.session.endedAtMs = Date.now();
    const targetsComplete = this.session.completedFactorizations.length >= this.session.level.targets.length;
    const objectivesComplete = this.areObjectivesComplete();
    this.session.cleared = targetsComplete;
    if (targetsComplete && objectivesComplete && !this.session.objectiveBonusAwarded) {
      const objectiveScore = ScoreSystem.scoreObjectiveBonus();
      this.applyScore(objectiveScore, false);
      this.session.objectiveBonusAwarded = true;
    }
    this.logDevSummary();
    this.scene.start("ResultScene", { session: this.session });
  }

  private cancelDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.selection.clear();
    this.pathLayer.clear();
    this.setSelectionVisuals([]);
    this.lastPointerCellKey = undefined;
    this.currentPointer = undefined;
  }

  private emitPopVfx(candy: Candy): void {
    const { x, y } = this.cellCenter(candy.row, candy.col);
    const burst = this.add.image(x, y, PRIME_POP_EFFECT_ASSETS.popBurst.key).setDisplaySize(this.cellSize * 1.55, this.cellSize * 1.18);
    const fragments = this.add
      .image(x, y, PRIME_POP_EFFECT_ASSETS.fragments.key)
      .setDisplaySize(this.cellSize * 1.55, this.cellSize * 0.86);
    const flash = this.add
      .image(x, y, PRIME_POP_EFFECT_ASSETS.impactFlash.key)
      .setDisplaySize(this.cellSize * 1.05, this.cellSize * 1.05)
      .setAlpha(0.42);
    this.tweens.add({
      targets: [burst, fragments, flash],
      scale: 1.15,
      alpha: 0,
      duration: 430,
      ease: "Cubic.easeOut",
      onComplete: () => {
        burst.destroy();
        fragments.destroy();
        flash.destroy();
      },
    });
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const dot = this.add.circle(x, y, 4, 0xffffff, 0.88);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * 34,
        y: y + Math.sin(angle) * 34,
        alpha: 0,
        scale: 0.4,
        duration: 260,
        ease: "Quad.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private playSuccessEffect(): void {
    const centerX = boardLayout.centerX;
    const centerY = boardLayout.centerY + 8;
    const shockwave = this.add
      .image(centerX, centerY, PRIME_POP_EFFECT_ASSETS.shockwave.key)
      .setDisplaySize(boardLayout.trayWidth * 0.84, boardLayout.trayWidth * 0.4)
      .setAlpha(0.9);
    const burst = this.add
      .image(centerX, centerY + 18, PRIME_POP_EFFECT_ASSETS.successBurst.key)
      .setDisplaySize(boardLayout.trayWidth * 0.72, boardLayout.trayWidth * 0.5)
      .setAlpha(0.88);
    const stars = this.add
      .image(centerX, centerY - 12, PRIME_POP_EFFECT_ASSETS.stars.key)
      .setDisplaySize(boardLayout.trayWidth * 0.55, boardLayout.trayWidth * 0.45)
      .setAlpha(0.92);
    this.tweens.add({
      targets: shockwave,
      scaleX: 1.18,
      scaleY: 1.18,
      alpha: 0,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => shockwave.destroy(),
    });
    this.tweens.add({
      targets: [burst, stars],
      y: "-=20",
      alpha: 0,
      duration: 850,
      ease: "Cubic.easeOut",
      onComplete: () => {
        burst.destroy();
        stars.destroy();
      },
    });
  }

  private floatScore(candies: Candy[], gained: number, chainLength: number): void {
    const anchor = candies.at(-1) ?? candies[0];
    if (!anchor) return;
    const { x, y } = this.cellCenter(anchor.row, anchor.col);
    const text = this.add
      .text(x, y - 24, `+${gained}`, {
        fontFamily: gameFontFamily,
        fontSize: `${Math.min(34, 18 + chainLength * 3)}px`,
        color: "#fff6a8",
        stroke: "#17204a",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: text,
      y: y - 72,
      alpha: 0,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private logDevSummary(): void {
    if (!import.meta.env.DEV) return;
    const playTimeSeconds = Math.round(((this.session.endedAtMs ?? Date.now()) - this.session.startedAtMs) / 1000);
    console.table({
      playTimeSeconds,
      movesUsed: this.session.level.moves - this.session.movesLeft,
      invalidSelections: this.session.invalidSelections,
      hintsUsed: this.session.hintsUsed,
      longestChain: this.session.longestChain,
      autoShuffleCount: this.session.autoShuffleCount,
      perfectTargetCount: this.session.perfectTargetCount,
      finalScore: this.session.score,
    });
  }

  private areObjectivesComplete(): boolean {
    const objectives = this.session.level.objectives;
    const dragGoalMet = objectives.maxDragsPerTarget
      ? this.session.targetsCompletedWithinDragGoal >= this.session.level.targets.length
      : true;
    const longChainMet = objectives.minLongChains
      ? this.session.longChainsCompleted >= objectives.minLongChains
      : true;
    const collectMet = objectives.collectPrimes
      ? Object.entries(objectives.collectPrimes).every(([prime, required]) => {
          const collected = this.session.collectedPrimes[Number(prime) as Prime] ?? 0;
          return collected >= (required ?? 0);
        })
      : true;
    return dragGoalMet && longChainMet && collectMet;
  }

  private useHint(): void {
    if (this.inputLocked) return;
    this.session.hintsUsed += 1;
    const level = Math.min(3, this.session.hintsUsed) as 1 | 2 | 3;
    const hint = HintSystem.createHint(this.board, this.session.currentRemainder, level);
    this.showRetryFeedback(hint.message || "\uD78C\uD2B8 \uD655\uC778!");
    for (const candy of hint.candies) {
      const object = this.candyObjects.get(candy.id);
      if (object) this.tweens.add({ targets: object, scale: 1.18, duration: 220, yoyo: true, repeat: 3 });
    }
    this.updateHud();
  }

  private pauseGame(): void {
    this.isPaused = !this.isPaused;
    this.inputLocked = this.isPaused;
    this.showRetryFeedback(this.isPaused ? "\uC77C\uC2DC\uC815\uC9C0" : "\uB2E4\uC2DC \uC2DC\uC791!");
  }

  private bindKeyboard(): void {
    this.input.keyboard?.on("keydown-ESC", () => this.pauseGame());
    this.input.keyboard?.on("keydown-H", () => this.useHint());
  }

  private cellCenter(row: number, col: number): { x: number; y: number } {
    return {
      x: this.boardX + this.cellSize / 2 + col * (this.cellSize + boardLayout.gapX),
      y: this.boardY + this.cellSize / 2 + row * (this.cellSize + boardLayout.gapY),
    };
  }

  private pointerToCell(x: number, y: number): { row: number; col: number } | undefined {
    const localX = x - this.boardX;
    const localY = y - this.boardY;
    const pitchX = this.cellSize + boardLayout.gapX;
    const pitchY = this.cellSize + boardLayout.gapY;
    const col = Math.round((localX - this.cellSize / 2) / pitchX);
    const row = Math.round((localY - this.cellSize / 2) / pitchY);
    if (row < 0 || row >= gameConfig.board.rows || col < 0 || col >= gameConfig.board.columns) {
      return undefined;
    }
    const centerX = this.cellSize / 2 + col * pitchX;
    const centerY = this.cellSize / 2 + row * pitchY;
    const distance = Math.hypot(localX - centerX, localY - centerY);
    if (distance > this.cellSize * 0.68) {
      return undefined;
    }
    return { row, col };
  }
}
