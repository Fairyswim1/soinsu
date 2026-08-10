import Phaser from "phaser";
import { gameConfig } from "../config/gameConfig";
import {
  PRIME_POP_BOARD_ASSETS,
  PRIME_POP_BUTTON_ASSETS,
  PRIME_POP_EFFECT_ASSETS,
  PRIME_POP_HUD_ASSETS,
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

const boardLayout = {
  centerX: 640,
  centerY: 392,
  frameWidth: 704,
  frameHeight: 470,
  innerWidth: 552,
  gap: 12,
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
  private hudLayer!: Phaser.GameObjects.Container;
  private blockerLayer!: Phaser.GameObjects.Container;
  private cellSize = 60;
  private boardX = 0;
  private boardY = 0;
  private isDragging = false;
  private inputLocked = false;
  private isPaused = false;
  private lastPointerCellKey?: string;
  private timerEvent?: Phaser.Time.TimerEvent;
  private stepText!: Phaser.GameObjects.Text;
  private equationText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private factorsText!: Phaser.GameObjects.Text;
  private missionText!: Phaser.GameObjects.Text;
  private currentPointer?: { x: number; y: number };
  private displayedTarget?: number;

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData): void {
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

  private drawShell(): void {
    this.add.rectangle(640, 360, 610, 708, 0x0d1438, 0.28).setStrokeStyle(2, 0x7ff3ff, 0.14);
    this.add
      .text(640, 26, `스테이지 ${this.session.level.id}: ${this.session.level.title}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#091138",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.addImageButton(860, 50, PRIME_POP_BUTTON_ASSETS.fullscreen.key, () => requestFullscreen(), 118, 78);
    this.addImageButton(1002, 50, PRIME_POP_BUTTON_ASSETS.hint.key, () => this.useHint(), 118, 78);
    this.addImageButton(1144, 50, PRIME_POP_BUTTON_ASSETS.pause.key, () => this.pauseGame(), 118, 78);
    this.add
      .image(640, 88, PRIME_POP_BOARD_ASSETS.targetPanel.key)
      .setDisplaySize(392, 118)
      .setAlpha(0.98);
    this.add
      .image(boardLayout.centerX, boardLayout.centerY, PRIME_POP_BOARD_ASSETS.frame.key)
      .setDisplaySize(boardLayout.frameWidth, boardLayout.frameHeight)
      .setAlpha(0.98);
    this.boardLayer = this.add.container(0, 0);
    this.pathLayer = this.add.graphics();
    this.blockerLayer = this.add.container(0, 0);
    this.hudLayer = this.add.container(0, 0);
    this.targetText = this.add
      .text(640, 88, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "58px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#102052",
        strokeThickness: 9,
      })
      .setOrigin(0.5);
    this.equationText = this.add
      .text(640, 153, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "31px",
        color: "#fff6a8",
        fontStyle: "bold",
        stroke: "#14205a",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.movesText = this.addHudBlock(430, 644, PRIME_POP_HUD_ASSETS.movesCard.key, "이동", "#ffffff");
    this.timeText = this.addHudBlock(640, 644, PRIME_POP_HUD_ASSETS.timeCard.key, "시간", "#ffd761");
    this.scoreText = this.addHudBlock(850, 644, PRIME_POP_HUD_ASSETS.scoreCard.key, "점수", "#ffffff");
    this.add.image(410, 686, PRIME_POP_HUD_ASSETS.smallChip.key).setDisplaySize(126, 42).setAlpha(0.96);
    this.add.image(556, 686, PRIME_POP_HUD_ASSETS.smallChip.key).setDisplaySize(126, 42).setAlpha(0.96);
    this.add.image(738, 686, PRIME_POP_HUD_ASSETS.longChip.key).setDisplaySize(220, 42).setAlpha(0.96);
    this.add.image(1012, 686, PRIME_POP_HUD_ASSETS.missionChip.key).setDisplaySize(280, 46).setAlpha(0.88);
    this.comboText = this.addText(358, 686, "", 14, "#bdefff", 112);
    this.stepText = this.addText(506, 686, "", 14, "#ffffff", 118);
    this.factorsText = this.addText(646, 686, "", 14, "#dfe8ff", 210);
    this.missionText = this.addText(884, 686, "", 13, "#bdefff", 250);
    this.feedbackText = this.addText(88, 686, "소수 타일을 드래그하세요.", 15, "#5be0ff", 230);
    this.hudLayer.add([
      this.targetText,
      this.equationText,
      this.movesText,
      this.timeText,
      this.scoreText,
      this.comboText,
      this.factorsText,
      this.missionText,
      this.stepText,
      this.feedbackText,
    ]);
  }

  private addImageButton(
    x: number,
    y: number,
    key: string,
    onClick: () => void,
    width: number,
    height: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const button = this.add.image(0, 0, key);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    const fit = Math.min(width / source.width, height / source.height);
    button.setScale(fit);
    container.add(button);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });
    container.on("pointerover", () => this.tweens.add({ targets: container, scale: 1.03, duration: 120, ease: "Sine.easeOut" }));
    container.on("pointerout", () => this.tweens.add({ targets: container, scale: 1, duration: 120, ease: "Sine.easeOut" }));
    container.on("pointerdown", () => this.tweens.add({ targets: container, scale: 0.96, duration: 80, ease: "Sine.easeOut" }));
    container.on("pointerup", () => {
      this.tweens.add({ targets: container, scale: 1.03, duration: 90, ease: "Sine.easeOut" });
      onClick();
    });
    return container;
  }

  private addHudBlock(x: number, y: number, key: string, label: string, color: string): Phaser.GameObjects.Text {
    const card = this.add.image(x, y, key).setAlpha(0.97);
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
    card.setScale(Math.min(176 / source.width, 96 / source.height));
    this.add
      .text(x, y - 12, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#aeefff",
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    return this.add
      .text(x, y + 18, "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        color,
        fontStyle: "bold",
        stroke: "#081236",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
  }

  private addText(x: number, y: number, text: string, size: number, color: string, width = 310): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${size}px`,
        color,
        stroke: "#081236",
        strokeThickness: 3,
        wordWrap: { width },
      })
      .setOrigin(0, 0.5);
  }

  private drawBoard(): void {
    this.boardLayer.removeAll(true);
    this.candyObjects.clear();
    this.cellSize = Math.floor(
      (boardLayout.innerWidth - boardLayout.gap * (gameConfig.board.columns - 1)) / gameConfig.board.columns,
    );
    const gridWidth = this.cellSize * gameConfig.board.columns + boardLayout.gap * (gameConfig.board.columns - 1);
    const gridHeight = this.cellSize * gameConfig.board.rows + boardLayout.gap * (gameConfig.board.rows - 1);
    this.boardX = Math.round(boardLayout.centerX - gridWidth / 2);
    this.boardY = Math.round(boardLayout.centerY - gridHeight / 2 + 8);
    for (const row of this.board) {
      for (const candy of row) {
        if (!candy) continue;
        const { x, y } = this.cellCenter(candy.row, candy.col);
        const container = this.add.container(x, y);
        const cell = this.add
          .image(0, 0, PRIME_POP_BOARD_ASSETS.cell.key)
          .setDisplaySize(this.cellSize, this.cellSize)
          .setAlpha(0.96);
        const tileKey = primeTileKey(candy.prime);
        const tileSize = Math.round(this.cellSize * 0.82);
        const image = this.add.image(0, 0, tileKey).setDisplaySize(tileSize, tileSize);
        image.setName("tile");
        const highlight = this.add
          .image(0, 0, PRIME_POP_BOARD_ASSETS.selectionHighlight.key)
          .setDisplaySize(Math.round(tileSize * 1.16), Math.round(tileSize * 1.16))
          .setVisible(false)
          .setAlpha(0.86);
        highlight.setName("highlight");
        this.tweens.add({
          targets: highlight,
          alpha: 1,
          scaleX: highlight.scaleX * 1.05,
          scaleY: highlight.scaleY * 1.05,
          duration: 430,
          yoyo: true,
          repeat: -1,
        });
        const children: Phaser.GameObjects.GameObject[] = [cell, image, highlight];
        const fallbackKeys = (this.registry.get("fallbackCandyKeys") as string[] | undefined) ?? [];
        if (!PRIME_TILE_ASSETS[candy.prime] || fallbackKeys.includes(tileKey)) {
          children.push(
            this.add
              .text(0, 1, String(candy.prime), {
                fontFamily: "Arial, sans-serif",
                fontSize: `${Math.floor(this.cellSize * 0.38)}px`,
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
              .text(0, -this.cellSize * 0.34, candy.special === "exponentBomb" ? "지수" : "로켓", {
                fontFamily: "Arial, sans-serif",
                fontSize: "16px",
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
    this.feedbackText.setText("시간 종료! 결과를 확인해요.");
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
      this.feedbackText.setText(state.invalidMessage);
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
      this.feedbackText.setText(result.message);
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
    this.feedbackText.setText(`${labels.join("  ")}  +${totalGained}`);
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
    this.equationText.setText(`${factors.join(" × ")} = ${this.session.originalTarget}`);
    this.showNumberBreakMessage();
    this.feedbackText.setText(FactorizationEngine.uniquenessFeedback(this.session.originalTarget, factors));
    this.playSuccessEffect();
    const nextTarget = this.session.level.targets[this.session.targetIndex + 1];
    if (!nextTarget) {
      this.time.delayedCall(650, () => this.finishGame());
      return;
    }
    this.time.delayedCall(620, () => {
      this.session.targetIndex += 1;
      this.session.originalTarget = nextTarget;
      this.session.currentRemainder = nextTarget;
      this.session.selectedFactors = [];
      this.session.currentTargetDragCount = 0;
      this.generator.ensureValidMove(this.board, nextTarget);
      this.inputLocked = false;
      this.feedbackText.setText("다음 목표 수가 준비됐어요.");
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
    this.factorsText.setText(`선택 ${all.join("×") || "-"}`);
    this.equationText.setText(all.length > 0 ? all.join(" × ") : "소수 타일을 연결하세요");
    this.stepText.setText(`남은 수 ${state.previewRemainder}`);
  }

  private updateHud(steps?: readonly number[]): void {
    this.targetText.setText(String(this.session.originalTarget));
    if (this.displayedTarget !== this.session.originalTarget) {
      this.displayedTarget = this.session.originalTarget;
      this.tweens.add({ targets: this.targetText, scale: 1.12, duration: 110, yoyo: true, ease: "Back.easeOut" });
    }
    this.movesText.setText(String(this.session.movesLeft));
    this.timeText.setText(this.formatTime(this.session.timeLeftSeconds));
    this.timeText.setColor(this.session.timeLeftSeconds <= 15 ? "#ff6c83" : "#ffd761");
    this.scoreText.setText(String(this.session.score));
    this.comboText.setText(`연속 ${this.session.combo}`);
    this.factorsText.setText(`선택 ${this.session.selectedFactors.join("×") || "-"}`);
    this.missionText.setText(this.formatMissionProgress());
    this.stepText.setText(`남은 수 ${(steps ?? [this.session.currentRemainder]).at(-1) ?? this.session.currentRemainder}`);
    this.equationText.setText(
      this.session.selectedFactors.length > 0 ? this.session.selectedFactors.join(" × ") : "소수 타일을 연결하세요",
    );
  }

  private showNumberBreakMessage(): void {
    const text = this.add
      .text(boardLayout.centerX, boardLayout.centerY - 18, "NUMBER BREAK!", {
        fontFamily: "Arial, sans-serif",
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#102052",
        strokeThickness: 9,
      })
      .setOrigin(0.5)
      .setScale(0.74)
      .setAlpha(0);
    this.tweens.add({
      targets: text,
      scale: 1.08,
      alpha: 1,
      duration: 130,
      ease: "Back.easeOut",
      yoyo: true,
      hold: 390,
      onComplete: () => text.destroy(),
    });
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  private formatMissionProgress(): string {
    const objectives = this.session.level.objectives;
    const parts: string[] = [];
    if (objectives.maxDragsPerTarget) {
      parts.push(
        `${objectives.maxDragsPerTarget}드래그 이내: ${this.session.targetsCompletedWithinDragGoal}/${this.session.level.targets.length}`,
      );
    }
    if (objectives.minLongChains) {
      parts.push(
        `${objectives.longChainLength ?? 4}+ 연결: ${this.session.longChainsCompleted}/${objectives.minLongChains}`,
      );
    }
    if (objectives.collectPrimes) {
      const collect = Object.entries(objectives.collectPrimes)
        .map(([prime, required]) => `${prime}:${this.session.collectedPrimes[Number(prime) as Prime] ?? 0}/${required}`)
        .join("  ");
      parts.push(`수집 ${collect}`);
    }
    return `미션: ${parts.join(" | ")}`;
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
      .setDisplaySize(boardLayout.innerWidth * 0.84, boardLayout.innerWidth * 0.4)
      .setAlpha(0.9);
    const burst = this.add
      .image(centerX, centerY + 18, PRIME_POP_EFFECT_ASSETS.successBurst.key)
      .setDisplaySize(boardLayout.innerWidth * 0.72, boardLayout.innerWidth * 0.5)
      .setAlpha(0.88);
    const stars = this.add
      .image(centerX, centerY - 12, PRIME_POP_EFFECT_ASSETS.stars.key)
      .setDisplaySize(boardLayout.innerWidth * 0.55, boardLayout.innerWidth * 0.45)
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
    this.feedbackText.setText(hint.message);
    for (const candy of hint.candies) {
      const object = this.candyObjects.get(candy.id);
      if (object) this.tweens.add({ targets: object, scale: 1.18, duration: 220, yoyo: true, repeat: 3 });
    }
    this.updateHud();
  }

  private pauseGame(): void {
    this.isPaused = !this.isPaused;
    this.inputLocked = this.isPaused;
    this.feedbackText.setText(this.isPaused ? "일시정지 중입니다." : "다시 시작!");
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
