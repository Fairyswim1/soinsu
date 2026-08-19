import Phaser from "phaser";
import { gameConfig } from "../config/gameConfig";
import { levels } from "../config/levels";
import { PRIME_POP_WORLD_MAP_ASSETS } from "../config/primePopAssets";
import { gameFontFamily } from "../config/theme";
import type { ClassroomState, GameMode } from "../models/GameSession";
import type { LevelConfig } from "../models/LevelModel";
import { LevelManager } from "../systems/LevelManager";
import { SaveManager, type SaveData } from "../systems/SaveManager";
import { BaseScene } from "./BaseScene";

type StageStatus = "locked" | "unlocked" | "current" | "completed";
type StageNodeType = "normal" | "reward" | "challenge" | "final";

type MapBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type StagePosition = {
  id: number;
  x: number;
  y: number;
  type?: StageNodeType;
};

type StageMapNode = StagePosition & {
  level: LevelConfig;
  name: string;
  status: StageStatus;
  stars: number;
  type: StageNodeType;
};

type LevelSelectSceneData = {
  mode?: GameMode;
  classroomState?: ClassroomState;
};

const CHAPTER = {
  title: "\uCCAB \uC5F0\uACB0",
  subtitle: "\uC2A4\uD14C\uC774\uC9C0\uB97C \uC120\uD0DD\uD558\uC138\uC694",
  signKey: PRIME_POP_WORLD_MAP_ASSETS.chapterSign1.key,
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

const STAGE_POSITIONS: StagePosition[] = [
  { id: 1, x: 9, y: 69 },
  { id: 2, x: 18, y: 60 },
  { id: 3, x: 28, y: 66 },
  { id: 4, x: 38, y: 53 },
  { id: 5, x: 49, y: 59, type: "reward" },
  { id: 6, x: 59, y: 47 },
  { id: 7, x: 68, y: 56 },
  { id: 8, x: 77, y: 43 },
  { id: 9, x: 86, y: 51 },
  { id: 10, x: 93, y: 34, type: "final" },
];

const NODE_DISPLAY_SIZE = 74;
const SPECIAL_NODE_DISPLAY_SIZE = 82;
const FINAL_NODE_DISPLAY_SIZE = 92;
const BACK_TO_TITLE_CROP = { x: 8, y: 384, width: 1239, height: 444 };

export class LevelSelectScene extends BaseScene {
  private infoPanel?: Phaser.GameObjects.Container;
  private currentMarker?: Phaser.GameObjects.Image;
  private mode: GameMode = "campaign";
  private classroomState?: ClassroomState;

  constructor() {
    super("LevelSelectScene");
  }

  create(data: LevelSelectSceneData = {}): void {
    this.mode = data.mode ?? "campaign";
    this.classroomState = data.classroomState;
    this.cameras.main.setBackgroundColor("#050b25");

    const save = SaveManager.load();
    const nodes = this.buildStageNodes(save);
    const mapBounds = this.addWorldMapBackground();

    this.addRouteHighlights(nodes, mapBounds);
    this.addSpecialLandmarks(nodes, mapBounds);
    this.addStageNodes(nodes, mapBounds);
    this.addChapterSign(mapBounds);
    this.addBackToTitleButton(mapBounds);
  }

  private buildStageNodes(save: SaveData): StageMapNode[] {
    const currentLevelId = Math.min(Math.max(save.unlockedLevel, 1), levels.length);

    return levels.map((level, index) => {
      const position = STAGE_POSITIONS.find((candidate) => candidate.id === level.id) ?? this.generatedPosition(index, levels.length);
      const stars = Math.max(0, Math.min(3, save.levelStars[String(level.id)] ?? 0));
      const status: StageStatus =
        this.mode === "classroom"
          ? "unlocked"
          : stars > 0
            ? "completed"
            : level.id === currentLevelId
              ? "current"
              : level.id < currentLevelId
                ? "unlocked"
                : "locked";

      return {
        ...position,
        level,
        name: LEVEL_DISPLAY_TITLES[level.id] ?? level.title,
        status,
        stars,
        type: position.type ?? (level.id === levels.length ? "final" : "normal"),
      };
    });
  }

  private generatedPosition(index: number, total: number): StagePosition {
    const progress = total <= 1 ? 0 : index / (total - 1);
    return {
      id: index + 1,
      x: 9 + progress * 84,
      y: 58 + Math.sin(progress * Math.PI * 3.2) * 13,
      type: index === total - 1 ? "final" : index === 4 ? "reward" : index === 9 ? "challenge" : "normal",
    };
  }

  private addWorldMapBackground(): MapBounds {
    const key = PRIME_POP_WORLD_MAP_ASSETS.background.key;
    const width = gameConfig.width;
    const height = gameConfig.height;
    const centerX = gameConfig.width / 2;
    const centerY = gameConfig.height / 2;

    this.add.image(centerX, centerY, key).setDisplaySize(width, height);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x02051b, 0.22);
    vignette.fillRect(0, 0, gameConfig.width, gameConfig.height);
    vignette.fillGradientStyle(0x02051b, 0x02051b, 0x02051b, 0x02051b, 0.44, 0.08, 0.1, 0.46);
    vignette.fillRect(0, 0, gameConfig.width, gameConfig.height);

    return {
      left: centerX - width / 2,
      top: centerY - height / 2,
      width,
      height,
    };
  }

  private mapPoint(bounds: MapBounds, xPercent: number, yPercent: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(bounds.left + bounds.width * (xPercent / 100), bounds.top + bounds.height * (yPercent / 100));
  }

  private addRouteHighlights(nodes: StageMapNode[], bounds: MapBounds): void {
    const route = this.add.graphics();

    for (let index = 0; index < nodes.length - 1; index += 1) {
      const from = nodes[index];
      const to = nodes[index + 1];
      const start = this.mapPoint(bounds, from.x, from.y);
      const end = this.mapPoint(bounds, to.x, to.y);
      const complete = from.status === "completed" && to.status !== "locked";
      const current = from.status === "completed" && to.status === "current";
      const locked = to.status === "locked";
      const controlX = (start.x + end.x) / 2;
      const controlY = (start.y + end.y) / 2 - 28 + (index % 2 === 0 ? -8 : 10);
      const curve = new Phaser.Curves.QuadraticBezier(start, new Phaser.Math.Vector2(controlX, controlY), end);
      const points = curve.getPoints(28);

      route.lineStyle(locked ? 5 : 7, locked ? 0x253153 : complete ? 0xffd56d : 0x42e8ff, locked ? 0.38 : 0.62);
      route.beginPath();
      points.forEach((point, pointIndex) => {
        if (pointIndex === 0) route.moveTo(point.x, point.y);
        else route.lineTo(point.x, point.y);
      });
      route.strokePath();

      if (current) {
        const glow = this.add.image((start.x + end.x) / 2, (start.y + end.y) / 2, PRIME_POP_WORLD_MAP_ASSETS.checkpointGlow.key);
        glow.setDisplaySize(120, 120).setAlpha(0.34).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: glow,
          alpha: 0.12,
          scaleX: glow.scaleX * 1.08,
          scaleY: glow.scaleY * 1.08,
          duration: 850,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  private addSpecialLandmarks(nodes: StageMapNode[], bounds: MapBounds): void {
    for (const node of nodes) {
      if (node.type === "normal") continue;
      const point = this.mapPoint(bounds, node.x, node.y);
      const key =
        node.type === "reward"
          ? PRIME_POP_WORLD_MAP_ASSETS.milestoneMonument.key
          : node.type === "challenge"
            ? PRIME_POP_WORLD_MAP_ASSETS.challengeGate.key
            : PRIME_POP_WORLD_MAP_ASSETS.finalGate.key;
      const size = node.type === "final" ? 116 : 92;
      this.add.image(point.x, point.y - size * 0.55, key).setDisplaySize(size, size).setAlpha(node.status === "locked" ? 0.46 : 0.86);
    }
  }

  private addStageNodes(nodes: StageMapNode[], bounds: MapBounds): void {
    for (const node of nodes) {
      const point = this.mapPoint(bounds, node.x, node.y);
      const size = this.nodeSize(node);
      const container = this.add.container(point.x, point.y).setDepth(20);
      const nodeImage = this.add.image(0, 0, this.nodeAssetKey(node)).setDisplaySize(size, size);
      nodeImage.setAlpha(node.status === "locked" ? 0.8 : 1);

      const numberText = this.add
        .text(0, -5, String(node.id), {
          fontFamily: gameFontFamily,
          fontSize: node.id >= 10 ? "25px" : "31px",
          color: node.status === "locked" ? "#d7e6ff" : "#ffffff",
          fontStyle: "bold",
          stroke: "#081236",
          strokeThickness: 6,
          shadow: { offsetX: 0, offsetY: 3, color: "#06113d", blur: 4, fill: true },
        })
        .setOrigin(0.5)
        .setAlpha(node.status === "locked" ? 0.68 : 1);

      container.add([nodeImage, numberText]);
      container.setSize(size, size);

      if (node.status !== "locked") {
        this.configureNodeInteraction(container, nodeImage, node, bounds);
      }

      if (node.status === "current") {
        this.addCurrentStageEffects(nodeImage, point, size);
      }

      if (node.status === "completed") {
        this.addStarRating(point.x, point.y + size * 0.56, node.stars, size);
      }
    }
  }

  private nodeSize(node: StageMapNode): number {
    if (node.type === "final") return FINAL_NODE_DISPLAY_SIZE;
    if (node.type === "reward" || node.type === "challenge") return SPECIAL_NODE_DISPLAY_SIZE;
    return NODE_DISPLAY_SIZE;
  }

  private nodeAssetKey(node: StageMapNode): string {
    if (node.status === "locked") return PRIME_POP_WORLD_MAP_ASSETS.lockedNode.key;
    if (node.status === "completed") return PRIME_POP_WORLD_MAP_ASSETS.completedNode.key;
    if (node.status === "current") return PRIME_POP_WORLD_MAP_ASSETS.currentNode.key;
    if (node.type === "reward") return PRIME_POP_WORLD_MAP_ASSETS.rewardNode.key;
    if (node.type === "challenge" || node.type === "final") return PRIME_POP_WORLD_MAP_ASSETS.challengeNode.key;
    return PRIME_POP_WORLD_MAP_ASSETS.normalNode.key;
  }

  private configureNodeInteraction(
    container: Phaser.GameObjects.Container,
    nodeImage: Phaser.GameObjects.Image,
    node: StageMapNode,
    bounds: MapBounds,
  ): void {
    const hitSize = this.nodeSize(node) * 1.08;
    const hitZone = this.add.zone(container.x, container.y, hitSize, hitSize).setDepth(40);
    hitZone.setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => {
      this.tweens.killTweensOf(container);
      this.tweens.add({ targets: container, scale: 1.035, duration: 150, ease: "Sine.easeOut" });
      nodeImage.setTint(0xffffff);
      this.showStageInfo(node, bounds);
    });

    hitZone.on("pointerout", () => {
      this.tweens.killTweensOf(container);
      this.tweens.add({ targets: container, scale: 1, duration: 150, ease: "Sine.easeOut" });
      nodeImage.clearTint();
      this.hideStageInfo();
    });

    hitZone.on("pointerdown", () => {
      this.tweens.killTweensOf(container);
      this.tweens.add({ targets: container, scale: 0.96, duration: 70, ease: "Sine.easeOut" });
    });

    hitZone.on("pointerup", () => {
      this.scene.start("GameScene", {
        mode: this.mode,
        levelId: node.id,
        classroomState: this.classroomState,
      });
    });
  }

  private addCurrentStageEffects(
    nodeImage: Phaser.GameObjects.Image,
    point: Phaser.Math.Vector2,
    nodeSize: number,
  ): void {
    const glint = this.add.image(point.x, point.y, PRIME_POP_WORLD_MAP_ASSETS.checkpointGlow.key);
    glint.setDisplaySize(nodeSize * 1.35, nodeSize * 1.35).setDepth(19).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glint, alpha: 0.34, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: nodeImage, alpha: 0.92, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.currentMarker = this.add.image(point.x, point.y - nodeSize * 0.86, PRIME_POP_WORLD_MAP_ASSETS.currentMarker.key);
    this.currentMarker.setDisplaySize(48, 72).setDepth(45).setAlpha(0.96);
    this.currentMarker.disableInteractive();
    this.tweens.add({ targets: this.currentMarker, y: this.currentMarker.y - 4, duration: 750, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private addStarRating(x: number, y: number, stars: number, nodeSize: number): void {
    const starSize = nodeSize * 0.2;
    const gap = starSize * 0.78;
    for (let index = 0; index < 3; index += 1) {
      const filled = index < stars;
      const key = filled ? PRIME_POP_WORLD_MAP_ASSETS.filledStar.key : PRIME_POP_WORLD_MAP_ASSETS.emptyStar.key;
      const star = this.add.image(x + (index - 1) * gap, y, key).setDisplaySize(starSize, starSize).setAlpha(filled ? 0.96 : 0.52);
      if (filled && stars === 3) {
        this.tweens.add({
          targets: star,
          scaleX: star.scaleX * 1.14,
          scaleY: star.scaleY * 1.14,
          duration: 420,
          yoyo: true,
          delay: index * 90,
          ease: "Back.easeOut",
        });
      }
    }
  }

  private showStageInfo(node: StageMapNode, bounds: MapBounds): void {
    this.hideStageInfo();

    const point = this.mapPoint(bounds, node.x, node.y);
    const panelWidth = 260;
    const panelHeight = 142;
    const x = Phaser.Math.Clamp(point.x + 8, bounds.left + panelWidth / 2 + 12, bounds.left + bounds.width - panelWidth / 2 - 12);
    const y = Phaser.Math.Clamp(point.y - 100, bounds.top + panelHeight / 2 + 10, bounds.top + bounds.height - panelHeight / 2 - 10);
    const panel = this.add.container(x, y).setDepth(50);
    const bg = this.add.graphics();
    bg.fillStyle(0x06133a, 0.86);
    bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 18);
    bg.lineStyle(2, 0x79ecff, 0.42);
    bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 18);

    const score = SaveManager.load().levelScores[String(node.id)] ?? 0;
    const targetCount = node.level.targetRules?.targetCount ?? node.level.targets.length;
    const difficulty = Math.min(3, Math.max(1, Math.ceil(targetCount / 2)));
    const text = this.add
      .text(-panelWidth / 2 + 18, -panelHeight / 2 + 14, `\uC2A4\uD14C\uC774\uC9C0 ${node.id}\n${node.name}\n${LevelManager.describeTargetRules(node.level)}\n\uB09C\uC774\uB3C4: ${"\u2605".repeat(difficulty)}${"\u2606".repeat(3 - difficulty)}\n\uCD5C\uACE0 \uAE30\uB85D: ${node.stars ? `${node.stars}\uC131 ? ${score}\uC810` : "\uC5C6\uC74C"}`, {
        fontFamily: gameFontFamily,
        fontSize: "15px",
        color: "#e9fbff",
        lineSpacing: 4,
        stroke: "#06113d",
        strokeThickness: 3,
        wordWrap: { width: panelWidth - 36, useAdvancedWrap: true },
      })
      .setOrigin(0, 0);

    panel.add([bg, text]);
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, y: y - 4, duration: 130, ease: "Sine.easeOut" });
    this.infoPanel = panel;
  }

  private hideStageInfo(): void {
    if (!this.infoPanel) return;
    this.infoPanel.destroy();
    this.infoPanel = undefined;
  }

  private addChapterSign(bounds: MapBounds): void {
    const x = bounds.left + 166;
    const y = bounds.top + 64;
    const sign = this.add.image(x, y, CHAPTER.signKey).setDisplaySize(246, 66).setDepth(60);
    sign.setAlpha(0.96);

    const title = this.mode === "classroom" ? "교실 대결" : CHAPTER.title;
    const subtitle =
      this.mode === "classroom" && this.classroomState
        ? `${this.classroomState.teams[this.classroomState.currentTeamIndex]} 차례  ·  스테이지 선택`
        : CHAPTER.subtitle;

    this.add
      .text(x, y - 6, title, {
        fontFamily: gameFontFamily,
        fontSize: "25px",
        color: "#fff4c2",
        fontStyle: "bold",
        stroke: "#3b154f",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(61);

    this.add
      .text(x, y + 24, subtitle, {
        fontFamily: gameFontFamily,
        fontSize: "14px",
        color: "#bff7ff",
        fontStyle: "bold",
        stroke: "#07123d",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(61);
  }

  private addBackToTitleButton(bounds: MapBounds): void {
    const x = bounds.left + 112;
    const y = bounds.top + bounds.height - 56;
    const buttonKey = this.getCroppedTexture(PRIME_POP_WORLD_MAP_ASSETS.backToTitle.key, BACK_TO_TITLE_CROP);
    const button = this.add.image(x, y, buttonKey).setDisplaySize(172, 62).setDepth(60);
    const baseScaleX = button.scaleX;
    const baseScaleY = button.scaleY;
    const hitZone = this.add.zone(x, y, 190, 78).setDepth(80);
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
}
