import type { Prime } from "../models/CandyModel";

export const PRIME_TILE_ASSETS: Partial<Record<Prime | 19, string>> = {
  2: "assets/number-break/runtime/tiles/prime_2.png",
  3: "assets/number-break/runtime/tiles/prime_3.png",
  5: "assets/number-break/runtime/tiles/prime_5.png",
  7: "assets/number-break/runtime/tiles/prime_7.png",
  11: "assets/number-break/runtime/tiles/prime_11.png",
  13: "assets/number-break/runtime/tiles/prime_13.png",
  17: "assets/number-break/runtime/tiles/prime_17.png",
  19: "assets/number-break/runtime/tiles/prime_19.png",
};

export const primeTileKey = (prime: number): string => `candy-${prime}`;

export const PRIME_POP_BOARD_ASSETS = {
  background: { key: "number-break-background", path: "assets/number-break/runtime/background_1280x720.png" },
  frame: { key: "number-break-board-frame", path: "assets/number-break/board/board_frame.png" },
  cell: { key: "number-break-grid-cell", path: "assets/number-break/board/grid_cell.png" },
  targetPanel: { key: "number-break-target-panel", path: "assets/number-break/hud/target_panel.png" },
  selectionHighlight: { key: "number-break-selection-highlight", path: "assets/number-break/effects/selection_highlight.png" },
};

export const PRIME_POP_BUTTON_ASSETS = {
  fullscreen: { key: "number-break-button-fullscreen", path: "assets/number-break/runtime/ui/fullscreen_button_118x78.png" },
  hint: { key: "number-break-button-hint", path: "assets/number-break/runtime/ui/hint_button_118x78.png" },
  pause: { key: "number-break-button-pause", path: "assets/number-break/runtime/ui/pause_button_118x78.png" },
  start: { key: "number-break-button-start", path: "assets/number-break/runtime/ui/start_button.png" },
  howto: { key: "number-break-button-howto", path: "assets/number-break/runtime/ui/howto_button.png" },
  quickPractice: { key: "number-break-button-quick-practice", path: "assets/number-break/buttons/quick_practice_button.png" },
  classroomMode: { key: "number-break-button-classroom-mode", path: "assets/number-break/buttons/classroom_mode_button.png" },
  settings: { key: "number-break-button-settings", path: "assets/number-break/buttons/settings_button.png" },
};

export const PRIME_POP_HUD_ASSETS = {
  movesCard: { key: "number-break-hud-moves", path: "assets/number-break/hud/generated/moves_card.png" },
  timeCard: { key: "number-break-hud-time", path: "assets/number-break/hud/generated/time_card.png" },
  scoreCard: { key: "number-break-hud-score", path: "assets/number-break/hud/generated/score_card.png" },
  smallChip: { key: "number-break-chip-small", path: "assets/number-break/runtime/ui/small_chip.png" },
  mediumChip: { key: "number-break-chip-medium", path: "assets/number-break/runtime/ui/medium_chip.png" },
  longChip: { key: "number-break-chip-long", path: "assets/number-break/runtime/ui/long_chip.png" },
  missionChip: { key: "number-break-chip-mission", path: "assets/number-break/runtime/ui/mission_chip.png" },
};

export const PRIME_POP_EFFECT_ASSETS = {
  popBurst: { key: "vfx-pop-burst", path: "assets/number-break/effects/generated/pop_burst.png" },
  shockwave: { key: "vfx-shockwave", path: "assets/number-break/effects/generated/shockwave.png" },
  fragments: { key: "vfx-fragments", path: "assets/number-break/effects/generated/fragments.png" },
  stars: { key: "vfx-stars", path: "assets/number-break/effects/generated/stars.png" },
  impactFlash: { key: "vfx-impact-flash", path: "assets/number-break/effects/generated/impact_flash.png" },
  glowingDots: { key: "vfx-glowing-dots", path: "assets/number-break/effects/generated/glowing_dots.png" },
  motionStreaks: { key: "vfx-motion-streaks", path: "assets/number-break/effects/generated/motion_streaks.png" },
  successBurst: { key: "vfx-success-burst", path: "assets/number-break/effects/generated/success_burst.png" },
};

export const PRIME_POP_SCREEN_ASSETS = {
  titleScreen: { key: "number-break-title-screen", path: "assets/number-break/screens/title/title_screen.png" },
  stageClearPopup: { key: "number-break-stage-clear-popup", path: "assets/number-break/popups/stage_clear_popup.png" },
  retryPopup: { key: "number-break-retry-popup", path: "assets/number-break/popups/retry_popup.png" },
};
