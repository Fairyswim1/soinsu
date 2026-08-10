export const scoringConfig = {
  baseCandy: 70,
  chainStep: 70,
  chainScores: [0, 70, 230, 560, 1080, 1700, 2450],
  perfectFactor: 1200,
  noHint: 450,
  exponentBonus: 420,
  longChainBonus: 850,
  objectiveBonus: 1400,
  streakBonus: 180,
  /** 남은 이동 1회당 */
  moveBonus: 85,
  /** 남은 시간 1초당 */
  timeBonusPerSecond: 5,
  obstacleDamage: 75,
  obstacleClear: 120,
  specialClear: 60,
} as const;
