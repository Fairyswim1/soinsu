import Phaser from "phaser";
import "./styles/global.css";
import { gameConfig } from "./game/config/gameConfig";
import { BootScene } from "./game/scenes/BootScene";
import { ClassroomScene } from "./game/scenes/ClassroomScene";
import { GameScene } from "./game/scenes/GameScene";
import { LevelSelectScene } from "./game/scenes/LevelSelectScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { PreloadScene } from "./game/scenes/PreloadScene";
import { QuickPracticeScene } from "./game/scenes/QuickPracticeScene";
import { ResultScene } from "./game/scenes/ResultScene";
import { SettingsScene } from "./game/scenes/SettingsScene";
import { TutorialScene } from "./game/scenes/TutorialScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: gameConfig.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameConfig.width,
    height: gameConfig.height,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  input: {
    activePointers: 3,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    LevelSelectScene,
    TutorialScene,
    GameScene,
    QuickPracticeScene,
    ClassroomScene,
    ResultScene,
    SettingsScene,
  ],
};

new Phaser.Game(config);
