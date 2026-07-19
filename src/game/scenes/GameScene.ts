import Phaser from "phaser";
import { gameConfig } from "../config/gameConfig";
import { scoringConfig } from "../config/scoring";
import { uiTheme } from "../config/theme";
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
  x: 52,
  y: 112,
  size: 552,
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
  private hudLayer!: Phaser.GameObjects.Container;
  private blockerLayer!: Phaser.GameObjects.Container;
  private cellSize = 60;
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

  constructor() {
    super("GameScene");
  }

  create(data: GameSceneData): void {
    this.addBackground();
    const level = data.level ?? LevelManager.getLevel(data.levelId ?? 1);
    const mode = data.mode ?? "campaign";
    this.session = createSession(mode, level);
    this.generator = new BoardGenerator({ availablePrimes: level.availablePrimes, seed: Date.now() % 100000 });
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
    this.add.rectangle(642, 382, 596, 596, 0xffffff, 0.07).setStrokeStyle(3, 0xffffff, 0.16);
    this.add.rectangle(950, 380, 360, 590, uiTheme.panel, 0.82).setStrokeStyle(2, 0xffffff, 0.16);
    this.add
      .text(72, 42, `스테이지 ${this.session.level.id}: ${this.session.level.title}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.addButton(1010, 52, "힌트", () => this.useHint(), 120);
    this.addButton(1150, 52, "일시정지", () => this.pauseGame(), 130);
    this.addButton(870, 52, "전체화면", () => requestFullscreen(), 130);
    this.boardLayer = this.add.container(0, 0);
    this.blockerLayer = this.add.container(0, 0);
    this.pathLayer = this.add.graphics();
    this.hudLayer = this.add.container(0, 0);
    this.targetText = this.addText(805, 118, "", 30, "#ffffff");
    this.movesText = this.addText(805, 166, "", 23, "#ffffff");
    this.timeText = this.addText(805, 208, "", 28, "#ffd761");
    this.scoreText = this.addText(805, 254, "", 23, "#ffffff");
    this.comboText = this.addText(805, 296, "", 23, "#ffffff");
    this.factorsText = this.addText(805, 344, "", 20, "#dfe8ff");
    this.missionText = this.addText(805, 402, "", 18, "#bdefff");
    this.stepText = this.addText(805, 470, "", 20, "#ffffff");
    this.equationText = this.addText(805, 526, "", 22, "#ffd761");
    this.feedbackText = this.addText(805, 620, "소수 사탕을 드래그하세요.", 19, "#5be0ff");
    this.hudLayer.add([
      this.targetText,
      this.movesText,
      this.timeText,
      this.scoreText,
      this.comboText,
      this.factorsText,
      this.missionText,
      this.stepText,
      this.equationText,
      this.feedbackText,
    ]);
  }

  private addText(x: number, y: number, text: string, size: number, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${size}px`,
        color,
        wordWrap: { width: 310 },
      })
      .setOrigin(0, 0.5);
  }

  private drawBoard(): void {
    this.boardLayer.removeAll(true);
    this.candyObjects.clear();
    this.cellSize =
      (boardLayout.size - boardLayout.gap * (gameConfig.board.columns - 1)) / gameConfig.board.columns;
    for (const row of this.board) {
      for (const candy of row) {
        if (!candy) continue;
        const { x, y } = this.cellCenter(candy.row, candy.col);
        const container = this.add.container(x, y);
        const shadow = this.add.circle(3, 7, this.cellSize * 0.43, 0x000000, 0.26);
        const image = this.add.image(0, 0, `candy-${candy.prime}`).setDisplaySize(this.cellSize * 0.92, this.cellSize * 0.92);
        const label = this.add
          .text(0, 1, String(candy.prime), {
            fontFamily: "Arial, sans-serif",
            fontSize: `${Math.floor(this.cellSize * 0.38)}px`,
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#162044",
            strokeThickness: 5,
          })
          .setOrigin(0.5);
        const special = candy.special
          ? this.add
              .text(0, -this.cellSize * 0.34, candy.special === "exponentBomb" ? "EXP" : "ROK", {
                fontFamily: "Arial, sans-serif",
                fontSize: "16px",
                color: "#fff6a8",
                stroke: "#162044",
                strokeThickness: 3,
              })
              .setOrigin(0.5)
          : undefined;
        container.add([shadow, image, label]);
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
    const cell = this.pointerToCell(pointer.x, pointer.y);
    if (!cell) return;
    const cellKey = `${cell.row}:${cell.col}`;
    if (cellKey === this.lastPointerCellKey) return;
    this.lastPointerCellKey = cellKey;
    const candy = this.board[cell.row]?.[cell.col] ?? null;
    if (candy) this.extendDrag(candy);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.inputLocked) return;
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
    this.feedbackText.setText(FactorizationEngine.uniquenessFeedback(this.session.originalTarget, factors));
    const nextTarget = this.session.level.targets[this.session.targetIndex + 1];
    if (!nextTarget) {
      this.finishGame();
      return;
    }
    this.session.targetIndex += 1;
    this.session.originalTarget = nextTarget;
    this.session.currentRemainder = nextTarget;
    this.session.selectedFactors = [];
    this.session.currentTargetDragCount = 0;
    this.generator.ensureValidMove(this.board, nextTarget);
    this.inputLocked = false;
    this.feedbackText.setText("다음 목표 수가 도착했어요!");
    this.updateHud();
  }

  private popCandies(candies: Candy[], onComplete: () => void): void {
    let remaining = candies.length;
    for (const candy of candies) {
      const object = this.candyObjects.get(candy.id);
      if (!object) {
        remaining -= 1;
        continue;
      }
      this.tweens.add({
        targets: object,
        scale: 0.82,
        alpha: 0,
        duration: 260,
        ease: "Back.easeIn",
        onComplete: () => {
          this.audio.play("pop");
          this.emitPopParticles(candy);
          remaining -= 1;
          if (remaining === 0) onComplete();
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
    if (candies.length < 2) return;
    this.pathLayer.lineStyle(17, 0xffffff, 0.22);
    this.pathLayer.beginPath();
    candies.forEach((candy, index) => {
      const { x, y } = this.cellCenter(candy.row, candy.col);
      if (index === 0) this.pathLayer.moveTo(x, y);
      else this.pathLayer.lineTo(x, y);
    });
    this.pathLayer.strokePath();
    this.pathLayer.lineStyle(10, 0x5be0ff, 0.9);
    this.pathLayer.beginPath();
    candies.forEach((candy, index) => {
      const { x, y } = this.cellCenter(candy.row, candy.col);
      if (index === 0) this.pathLayer.moveTo(x, y);
      else this.pathLayer.lineTo(x, y);
    });
    this.pathLayer.strokePath();
  }

  private previewSelection(state: { factors: Prime[]; previewRemainder: number }): void {
    const all = [...this.session.selectedFactors, ...state.factors];
    this.factorsText.setText(`선택한 소수: ${all.join(" × ") || "-"}`);
    this.equationText.setText(FactorizationEngine.formatEquation(this.session.originalTarget, all));
    this.targetText.setText(`목표 ${this.session.originalTarget}  남은 수 ${state.previewRemainder}`);
  }

  private updateHud(steps?: readonly number[]): void {
    this.targetText.setText(`목표 ${this.session.originalTarget}  남은 수 ${this.session.currentRemainder}`);
    this.movesText.setText(`남은 이동: ${this.session.movesLeft}`);
    this.timeText.setText(`남은 시간: ${this.formatTime(this.session.timeLeftSeconds)}`);
    this.timeText.setColor(this.session.timeLeftSeconds <= 15 ? "#ff6c83" : "#ffd761");
    this.scoreText.setText(`점수: ${this.session.score}`);
    const comboDisplay = this.session.combo <= 0 ? "x1" : `x${(1 + this.session.combo * scoringConfig.comboStep).toFixed(2)}`;
    this.comboText.setText(`콤보: ${comboDisplay}`);
    this.factorsText.setText(`선택한 소수: ${this.session.selectedFactors.join(" × ") || "-"}`);
    this.missionText.setText(this.formatMissionProgress());
    this.stepText.setText(`과정: ${(steps ?? [this.session.currentRemainder]).join(" → ")}`);
    this.equationText.setText(FactorizationEngine.formatEquation(this.session.originalTarget, this.session.selectedFactors));
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
    this.session.cleared =
      this.session.completedFactorizations.length >= this.session.level.targets.length;
    if (this.session.cleared && !this.session.objectiveBonusAwarded && this.areObjectivesComplete()) {
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
    this.lastPointerCellKey = undefined;
  }

  private emitPopParticles(candy: Candy): void {
    const { x, y } = this.cellCenter(candy.row, candy.col);
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
      x: boardLayout.x + this.cellSize / 2 + col * (this.cellSize + boardLayout.gap),
      y: boardLayout.y + this.cellSize / 2 + row * (this.cellSize + boardLayout.gap),
    };
  }

  private pointerToCell(x: number, y: number): { row: number; col: number } | undefined {
    const localX = x - boardLayout.x;
    const localY = y - boardLayout.y;
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
