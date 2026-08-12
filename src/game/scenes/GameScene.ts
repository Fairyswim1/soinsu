import Phaser from "phaser";
import { gameConfig } from "../config/gameConfig";
import {
  PRIME_POP_BOARD_ASSETS,
  PRIME_POP_BUTTON_ASSETS,
  PRIME_POP_EFFECT_ASSETS,
  PRIME_POP_GAMEPLAY_ASSETS,
  PRIME_TILE_ASSETS,
  primeTileKey,
} from "../config/primePopAssets";
import type { Blocker } from "../models/BlockerModel";
import type { Board, Candy, Prime, SpecialCandy } from "../models/CandyModel";
import { createSession, type GameMode, type GameSession } from "../models/GameSession";
import type { LevelConfig } from "../models/LevelModel";
import { AudioManager } from "../systems/AudioManager";
import { BlockerSystem } from "../systems/BlockerSystem";
import { BoardGenerator } from "../systems/BoardGenerator";
import { FactorizationEngine } from "../systems/FactorizationEngine";
import { HintSystem } from "../systems/HintSystem";
import { LevelManager } from "../systems/LevelManager";
import { ScoreSystem } from "../systems/ScoreSystem";
import { SelectionSystem } from "../systems/SelectionSystem";
import { SpecialCandySystem } from "../systems/SpecialCandySystem";
import { requestFullscreen } from "../utils/responsive";
import { BaseScene } from "./BaseScene";

type GameSceneData = {
  mode?: GameMode;
  levelId?: number;
  level?: LevelConfig;
};


const LEVEL_DISPLAY_TITLES: Record<number, string> = {
  1: "\uCCAB \uC5F0\uACB0",
  2: "5 \uB354\uD558\uAE30",
  3: "\uAC19\uC740 \uC18C\uC218 \uBC18\uBCF5",
  4: "\uAE34 \uC5F0\uACB0 \uBCF4\uB108\uC2A4",
  5: "\uC911\uAC04 \uBCF4\uC0C1\uB300",
  6: "\uBD88\uC548\uC815\uD55C \uC18C\uC218",
  7: "7\uC758 \uAD00\uBB38",
  8: "\uD569\uC131\uC218 \uC5BC\uC74C",
  9: "\uC5EC\uB7EC \uBAA9\uD45C \uC5F0\uC18D",
  10: "\uD2B9\uC218 \uBB38\uC7A5 \uC2DC\uD5D8",
};

const boardLayout = {
  centerX: 640,
  centerY: 415,
  frameWidth: 780,
  frameHeight: 470,
  trayWidth: 680,
  trayHeight: 390,
  trayPadding: 10,
  gap: 8,
};

export class GameScene extends BaseScene {
  private board!: Board;
  private generator!: BoardGenerator;
  private selection!: SelectionSystem;
  private session!: GameSession;
  private blockers: Blocker[] = [];
  private readonly audio = new AudioManager();
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
  private comboText!: Phaser.GameObjects.Text;
  private factorsText!: Phaser.GameObjects.Text;
  private missionText!: Phaser.GameObjects.Text;
  private currentPointer?: { x: number; y: number };
  private displayedTarget?: number;
  private feedbackBanner?: Phaser.GameObjects.Container;
  private streakBadge?: Phaser.GameObjects.Container;

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData): void {
    this.resetSceneState();
    this.addBackground();
    const level = data.level ?? LevelManager.getLevel(data.levelId ?? 1);
    const mode = data.mode ?? "campaign";
    this.session = createSession(mode, level);
    this.generator = new BoardGenerator({
      availablePrimes: level.availablePrimes,
      seed: Date.now() % 100000,
      ...level.boardTuning,
    });
    this.board = this.generator.createBoard(this.session.currentRemainder);
    this.session.autoShuffleCount = this.generator.shuffleCount;
    this.selection = new SelectionSystem(this.board);
    this.blockers = BlockerSystem.createBlockers(level.obstacles);
    this.audio.setMuted(false);

    this.drawShell();
    this.drawBoard();
    this.drawBlockers();
    this.updateHud();
    this.bindKeyboard();
    this.startTimer();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.cancelDrag, this);
    this.input.on(Phaser.Input.Events.GAME_OUT, this.cancelDrag, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.timerEvent?.remove(false));
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

    this.add.image(640, 42, PRIME_POP_GAMEPLAY_ASSETS.stageHeaderPanel.key).setDisplaySize(360, 76).setAlpha(0.96);
    this.add
      .text(640, 28, `\uC2A4\uD14C\uC774\uC9C0 ${this.session.level.id}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#bff7ff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.add
      .text(640, 52, (LEVEL_DISPLAY_TITLES[this.session.level.id] ?? this.session.level.title), {
        fontFamily: "Arial, sans-serif",
        fontSize: "23px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.addImageButton(914, 43, PRIME_POP_BUTTON_ASSETS.fullscreen.key, () => requestFullscreen(), 86, 58);
    this.addImageButton(1014, 43, PRIME_POP_BUTTON_ASSETS.hint.key, () => this.useHint(), 86, 58);
    this.addImageButton(1114, 43, PRIME_POP_BUTTON_ASSETS.pause.key, () => this.pauseGame(), 86, 58);

    this.add.image(640, 112, PRIME_POP_BOARD_ASSETS.targetPanel.key).setDisplaySize(408, 104).setAlpha(0.98);
    this.targetText = this.add
      .text(640, 111, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 0, color: "#5be0ff", blur: 10, fill: true },
      })
      .setOrigin(0.5);

    this.add.image(640, 184, PRIME_POP_GAMEPLAY_ASSETS.factorChainPanel.key).setDisplaySize(552, 74).setAlpha(0.98);
    this.equationText = this.add
      .text(640, 184, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#eaffff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.factorsText = this.add
      .text(640, 208, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#ffe88c",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0.86);

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

    this.add.image(640, 650, PRIME_POP_GAMEPLAY_ASSETS.hudBar.key).setDisplaySize(612, 86).setAlpha(0.98);
    this.movesText = this.addHudValue(448, 655, "\uC774\uB3D9", "#ffffff");
    this.timeText = this.addHudValue(640, 655, "\uC2DC\uAC04", "#ffe88c");
    this.scoreText = this.addHudValue(832, 655, "\uC810\uC218", "#ffffff");

    this.add.image(1076, 648, PRIME_POP_GAMEPLAY_ASSETS.missionPanel.key).setDisplaySize(332, 112).setAlpha(0.96);
    this.missionText = this.add
      .text(946, 623, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#e9fbff",
        fontStyle: "bold",
        lineSpacing: 5,
        stroke: "#07123d",
        strokeThickness: 3,
        wordWrap: { width: 264 },
      })
      .setOrigin(0, 0);

    this.comboText = this.add.text(0, 0, "").setVisible(false);

    this.tweens.add({ targets: [this.targetText, this.equationText], alpha: { from: 0, to: 1 }, y: "+=0", duration: 220 });
    this.boardLayer.setAlpha(0);
    this.tweens.add({ targets: this.boardLayer, alpha: 1, y: "-=6", duration: 240, ease: "Sine.easeOut" });
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
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#aeefff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    return this.add
      .text(x, y + 10, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "29px",
        color,
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
  }

  private pulseText(text: Phaser.GameObjects.Text): void {
    this.tweens.add({ targets: text, scale: 1.08, duration: 90, yoyo: true, ease: "Back.easeOut" });
  }

  private drawBoard(): void {
    this.boardLayer.removeAll(true);
    this.candyObjects.clear();
    const rows = gameConfig.board.rows;
    const columns = gameConfig.board.columns;
    const maxTileByWidth = Math.floor((boardLayout.trayWidth - boardLayout.trayPadding * 2) / (columns + (columns - 1) * 0.2));
    const maxTileByHeight = Math.floor((boardLayout.trayHeight - boardLayout.trayPadding * 2) / (rows + (rows - 1) * 0.2));
    this.cellSize = Math.min(64, maxTileByWidth, maxTileByHeight);
    const gap = Math.max(8, Math.round(this.cellSize * 0.18));
    boardLayout.gap = gap;
    const gridWidth = this.cellSize * columns + gap * (columns - 1);
    const gridHeight = this.cellSize * rows + gap * (rows - 1);
    this.boardX = Math.round(boardLayout.centerX - gridWidth / 2);
    this.boardY = Math.round(boardLayout.centerY + 4 - gridHeight / 2);

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
                fontFamily: "Arial, sans-serif",
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
                fontFamily: "Arial, sans-serif",
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
      const box = this.add
        .rectangle(
          x,
          y,
          this.cellSize * 0.82,
          this.cellSize * 0.82,
          blocker.type === "compositeIce" ? 0xb9f2ff : 0x7654c9,
          0.54,
        )
        .setStrokeStyle(3, 0xffffff, 0.72);
      const label =
        blocker.type === "compositeIce"
          ? `${blocker.current}`
          : Object.entries(blocker.required)
              .map(([prime, count]) => `${prime}:${(blocker.used[Number(prime) as Prime] ?? 0)}/${count}`)
              .join(" ");
      const text = this.add
        .text(x, y, label, {
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          color: "#ffffff",
          stroke: "#1a2354",
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      this.blockerLayer.add([box, text]);
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
      this.showRetryFeedback(state.invalidMessage || "\uB2E4\uC2DC \uC120\uD0DD!");
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
    if (candy) this.beginDrag(candy);
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
      this.showRetryFeedback(result.message || "\uB2E4\uC2DC \uC120\uD0DD!");
      this.audio.play("invalid");
      this.session.invalidSelections += 1;
      if (this.session.level.wrongDragPenalty) this.session.movesLeft -= 1;
      this.updateHud();
      return;
    }
    this.inputLocked = true;
    const score = ScoreSystem.scoreSelection(this.session, factors, result.completed);
    this.applyScore(score);
    this.session.combo += 1;
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

    const totalGained = score.gained + obstacleScore.gained + specialScore.gained;
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
        this.advanceTargetOrFinish();
      } else if (this.session.movesLeft <= 0) {
        this.finishGame();
      } else {
        this.inputLocked = false;
        this.updateHud(result.steps);
      }
    });
  }

  private applyScore(result: ReturnType<typeof ScoreSystem.scoreSelection>): void {
    this.session.score += result.gained;
    ScoreSystem.mergeBreakdown(this.session.scoreBreakdown, result.parts);
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
    this.factorsText.setText(
      all.length > 0
        ? `\uD604\uC7AC \uACF1: ${this.session.originalTarget / Math.max(1, state.previewRemainder)}  \u00B7  \uB0A8\uC740 \uAC12: ${state.previewRemainder}`
        : "",
    );
    if (state.factors.length > 0) this.popFactorChain();
  }

  private updateHud(steps?: readonly number[]): void {
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
    if (previousMoves && previousMoves !== this.movesText.text) this.pulseText(this.movesText);
    if (previousTime && previousTime !== this.timeText.text) this.pulseText(this.timeText);
    if (previousScore && previousScore !== this.scoreText.text) this.pulseText(this.scoreText);

    this.comboText.setText(`\uC5F0\uC18D ${this.session.combo}`);
    this.missionText.setText(this.formatMissionProgress());
    const selected = this.session.selectedFactors;
    const remainder = (steps ?? [this.session.currentRemainder]).at(-1) ?? this.session.currentRemainder;
    this.factorsText.setText(selected.length > 0 ? `\uB0A8\uC740 \uAC12: ${remainder}` : "");
    this.equationText.setText(selected.length > 0 ? selected.join(" \u00D7 ") : "\uC120\uD0DD \uB300\uAE30");
  }

  private showResultFeedback(key: string, message: string, retry = false): void {
    this.feedbackBanner?.destroy();
    const container = this.add.container(boardLayout.centerX, boardLayout.centerY - 12).setDepth(90).setAlpha(0).setScale(0.76);
    const banner = this.add.image(0, 0, key).setDisplaySize(390, 150).setAlpha(0.98);
    const text = this.add
      .text(0, 2, message, {
        fontFamily: "Arial, sans-serif",
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

  private popFactorChain(): void {
    this.tweens.killTweensOf(this.equationText);
    this.equationText.setScale(0.86);
    this.tweens.add({ targets: this.equationText, scale: 1, duration: 150, ease: "Back.easeOut" });
  }

  private showStreakBadge(): void {
    if (this.session.combo < 2) return;
    this.streakBadge?.destroy();
    const container = this.add.container(902, 214).setDepth(88).setAlpha(0).setScale(0.7);
    const badge = this.add.image(0, 0, PRIME_POP_GAMEPLAY_ASSETS.streakBadge.key).setDisplaySize(190, 86).setAlpha(0.98);
    const text = this.add
      .text(0, 0, `\uC5F0\uC18D \uC131\uACF5 ${this.session.combo}\uD68C!`, {
        fontFamily: "Arial, sans-serif",
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

  private formatMissionProgress(): string {
    const objectives = this.session.level.objectives;
    const lines: string[] = [];
    if (objectives.maxDragsPerTarget) {
      const done = this.session.targetsCompletedWithinDragGoal;
      const total = this.session.level.targets.length;
      lines.push(`${done >= total ? "\u2713" : "\u2022"} ${objectives.maxDragsPerTarget}\uB4DC\uB798\uADF8 \uC774\uB0B4 ${done}/${total}`);
    }
    if (objectives.minLongChains) {
      const done = this.session.longChainsCompleted;
      const total = objectives.minLongChains;
      lines.push(`${done >= total ? "\u2713" : "\u2022"} ${objectives.longChainLength ?? 4}+ \uC5F0\uACB0 ${done}/${total}`);
    }
    if (objectives.collectPrimes) {
      for (const [prime, required] of Object.entries(objectives.collectPrimes).slice(0, Math.max(1, 3 - lines.length))) {
        const done = this.session.collectedPrimes[Number(prime) as Prime] ?? 0;
        lines.push(`${done >= (required ?? 0) ? "\u2713" : "\u2022"} ${prime} \uC218\uC9D1 ${done}/${required}`);
      }
    }
    return lines.length > 0 ? lines.slice(0, 3).join("\n") : "\u2022 \uBAA9\uD45C \uC22B\uC790\uB97C \uBD84\uD574";
  }
  private finishGame(): void {
    this.session.endedAtMs = Date.now();
    const targetsComplete = this.session.completedFactorizations.length >= this.session.level.targets.length;
    const objectivesComplete = this.areObjectivesComplete();
    this.session.cleared = targetsComplete && objectivesComplete;
    if (this.session.cleared && !this.session.objectiveBonusAwarded && objectivesComplete) {
      const objectiveScore = ScoreSystem.scoreObjectiveBonus();
      this.applyScore(objectiveScore);
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
        fontFamily: "Arial, sans-serif",
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
      x: this.boardX + this.cellSize / 2 + col * (this.cellSize + boardLayout.gap),
      y: this.boardY + this.cellSize / 2 + row * (this.cellSize + boardLayout.gap),
    };
  }

  private pointerToCell(x: number, y: number): { row: number; col: number } | undefined {
    const localX = x - this.boardX;
    const localY = y - this.boardY;
    const pitch = this.cellSize + boardLayout.gap;
    const col = Math.round((localX - this.cellSize / 2) / pitch);
    const row = Math.round((localY - this.cellSize / 2) / pitch);
    if (row < 0 || row >= gameConfig.board.rows || col < 0 || col >= gameConfig.board.columns) {
      return undefined;
    }
    const centerX = this.cellSize / 2 + col * pitch;
    const centerY = this.cellSize / 2 + row * pitch;
    const distance = Math.hypot(localX - centerX, localY - centerY);
    if (distance > this.cellSize * 0.68) {
      return undefined;
    }
    return { row, col };
  }
}
