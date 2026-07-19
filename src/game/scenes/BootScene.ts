import { BaseScene } from "./BaseScene";

export class BootScene extends BaseScene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.scene.start("PreloadScene");
  }
}
