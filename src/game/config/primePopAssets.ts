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
  classroomMode: { key: "number-break-button-classroom-mode", path: "assets/number-break/buttons/fighter_mode_button.png?v=20260819-1215" },
  settings: { key: "number-break-button-settings", path: "assets/number-break/buttons/settings_button.png" },
  musicOn: { key: "number-break-button-music-on-v20260819-1353", path: "assets/number-break/settings/btn_music_on.png?v=20260819-1353" },
  musicOff: {
    key: "number-break-button-music-off-v20260819-1353",
    path: "assets/number-break/settings/btn_music_off.png?v=20260819-1353",
  },
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
  titleScreen: { key: "number-break-title-screen", path: "assets/number-break/screens/title/title_screen_v2.png" },
  tutorialScreen: { key: "number-break-tutorial-screen", path: "assets/number-break/screens/tutorial/howto_screen.png" },
  stageClearPopup: { key: "number-break-stage-clear-popup", path: "assets/number-break/popups/stage_clear_popup.png" },
  retryPopup: { key: "number-break-retry-popup", path: "assets/number-break/popups/retry_popup.png" },
};

export const PRIME_POP_SETTINGS_ASSETS = {
  background: { key: "number-break-settings-background", path: "assets/number-break/settings/settings_background.png" },
  toggleMute: { key: "number-break-settings-toggle-mute", path: "assets/number-break/settings/btn_toggle_mute.png" },
  toggleReduceMotion: {
    key: "number-break-settings-toggle-reduce-motion",
    path: "assets/number-break/settings/btn_toggle_reduce_motion.png",
  },
  resetSave: { key: "number-break-settings-reset-save", path: "assets/number-break/settings/btn_reset_save.png?v=20260819-1325" },
  unlockAll: { key: "number-break-settings-unlock-all", path: "assets/number-break/settings/btn_unlock_all.png?v=20260819-1205" },
  menu: { key: "number-break-settings-menu", path: "assets/number-break/settings/btn_menu.png" },
};

export const PRIME_POP_BATTLE_ASSETS = {
  background: { key: "number-break-battle-background", path: "assets/number-break/battle/battle_background.png" },
  stageSelect: { key: "number-break-battle-stage-select", path: "assets/number-break/battle/btn_stage_select.png" },
  resetScore: { key: "number-break-battle-reset-score", path: "assets/number-break/battle/btn_reset_score.png" },
  title: { key: "number-break-battle-title", path: "assets/number-break/battle/btn_title.png" },
};

export const PRIME_POP_PRACTICE_ASSETS = {
  quickPracticeBackground: {
    key: "number-break-quick-practice-background",
    path: "assets/number-break/practice/practicequick_practice_background.png",
  },
};

export const PRIME_POP_AUDIO_ASSETS = {
  bgm: {
    key: "number-break-bgm",
    path: "assets/number-break/audio/019_seven_and_eight_7-8_combined.mp3",
  },
};

export const PRIME_POP_WORLD_MAP_ASSETS = {
  background: { key: "number-break-world-map-bg", path: "assets/number-break/world-map/background/chapter_map_bg.png" },
  currentMarker: { key: "number-break-world-map-current-marker", path: "assets/number-break/world-map/markers/current_stage_marker.png" },
  backToTitle: { key: "number-break-world-map-back-title", path: "assets/number-break/world-map/ui/back_to_title_button.png" },
  lockIcon: { key: "number-break-world-map-lock-icon", path: "assets/number-break/world-map/ui/lock_icon.png" },
  normalNode: { key: "number-break-world-map-node-normal", path: "assets/number-break/world-map/nodes/generated/normal_node.png" },
  currentNode: { key: "number-break-world-map-node-current", path: "assets/number-break/world-map/nodes/generated/current_node.png" },
  completedNode: { key: "number-break-world-map-node-completed", path: "assets/number-break/world-map/nodes/generated/completed_node.png" },
  lockedNode: { key: "number-break-world-map-node-locked", path: "assets/number-break/world-map/nodes/generated/locked_node.png" },
  rewardNode: { key: "number-break-world-map-node-reward", path: "assets/number-break/world-map/nodes/generated/reward_node.png" },
  challengeNode: { key: "number-break-world-map-node-challenge", path: "assets/number-break/world-map/nodes/generated/challenge_node.png" },
  straightPath: { key: "number-break-world-map-path-straight", path: "assets/number-break/world-map/paths/generated/straight_path.png" },
  curveLeftPath: { key: "number-break-world-map-path-curve-left", path: "assets/number-break/world-map/paths/generated/curve_left.png" },
  curveRightPath: { key: "number-break-world-map-path-curve-right", path: "assets/number-break/world-map/paths/generated/curve_right.png" },
  sCurvePath: { key: "number-break-world-map-path-s-curve", path: "assets/number-break/world-map/paths/generated/s_curve.png" },
  diagonalPath: { key: "number-break-world-map-path-diagonal", path: "assets/number-break/world-map/paths/generated/diagonal_path.png" },
  branchPath: { key: "number-break-world-map-path-branch", path: "assets/number-break/world-map/paths/generated/branch_path.png" },
  completedPath: { key: "number-break-world-map-path-completed", path: "assets/number-break/world-map/paths/generated/completed_path.png" },
  lockedPath: { key: "number-break-world-map-path-locked", path: "assets/number-break/world-map/paths/generated/locked_path.png" },
  checkpointGlow: { key: "number-break-world-map-path-checkpoint-glow", path: "assets/number-break/world-map/paths/generated/checkpoint_glow.png" },
  emptyStar: { key: "number-break-world-map-star-empty", path: "assets/number-break/world-map/ui/generated/empty_star.png" },
  filledStar: { key: "number-break-world-map-star-filled", path: "assets/number-break/world-map/ui/generated/filled_star.png" },
  glowingStar: { key: "number-break-world-map-star-glowing", path: "assets/number-break/world-map/ui/generated/glowing_star.png" },
  threeStarGroup: { key: "number-break-world-map-star-three-group", path: "assets/number-break/world-map/ui/generated/three_star_group.png" },
  rewardChest: { key: "number-break-world-map-special-reward-chest", path: "assets/number-break/world-map/special/generated/reward_chest.png" },
  crystalReward: { key: "number-break-world-map-special-crystal-reward", path: "assets/number-break/world-map/special/generated/crystal_reward.png" },
  bonusPortal: { key: "number-break-world-map-special-bonus-portal", path: "assets/number-break/world-map/special/generated/bonus_portal.png" },
  challengeGate: { key: "number-break-world-map-special-challenge-gate", path: "assets/number-break/world-map/special/generated/challenge_gate.png" },
  milestoneMonument: { key: "number-break-world-map-special-milestone", path: "assets/number-break/world-map/special/generated/milestone_monument.png" },
  finalGate: { key: "number-break-world-map-special-final-gate", path: "assets/number-break/world-map/special/generated/final_gate.png" },
  chapterSign1: { key: "number-break-world-map-sign-1", path: "assets/number-break/world-map/signs/generated/chapter_sign_1.png" },
  chapterSign2: { key: "number-break-world-map-sign-2", path: "assets/number-break/world-map/signs/generated/chapter_sign_2.png" },
  chapterSign3: { key: "number-break-world-map-sign-3", path: "assets/number-break/world-map/signs/generated/chapter_sign_3.png" },
  chapterSign4: { key: "number-break-world-map-sign-4", path: "assets/number-break/world-map/signs/generated/chapter_sign_4.png" },
};

export const PRIME_POP_GAMEPLAY_ASSETS = {
  boardInnerTray: { key: "number-break-gameplay-board-inner-tray", path: "assets/number-break/gameplay/board_inner_tray.png" },
  stageHeaderPanel: { key: "number-break-gameplay-stage-header-panel", path: "assets/number-break/gameplay/stage_header_panel.png" },
  factorChainPanel: { key: "number-break-gameplay-factor-chain-panel", path: "assets/number-break/gameplay/factor_chain_panel.png" },
  hudBar: { key: "number-break-gameplay-hud-bar", path: "assets/number-break/gameplay/gameplay_hud_bar.png" },
  missionPanel: { key: "number-break-gameplay-mission-panel", path: "assets/number-break/gameplay/mission_panel.png" },
  streakBadge: { key: "number-break-gameplay-streak-badge", path: "assets/number-break/gameplay/streak_badge.png" },
  feedbackSuccess: { key: "number-break-gameplay-feedback-success", path: "assets/number-break/gameplay/generated/feedback_success.png" },
  feedbackRetry: { key: "number-break-gameplay-feedback-retry", path: "assets/number-break/gameplay/generated/feedback_retry.png" },
};

