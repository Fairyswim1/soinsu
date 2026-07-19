export const scoringConfig = {
  baseCandy: 100,
  chainStep: 40,
  chainScores: [0, 100, 250, 500, 900, 1300, 1750],
  perfectFactor: 650,
  noHint: 350,
  exponentBonus: 300,
  longChainBonus: 450,
  objectiveBonus: 900,
  comboStep: 0.18,
  /** 남은 이동 1회당 — 과도한 점수 폭주를 막기 위해 낮춤 */
  moveBonus: 50,
  /** 남은 시간 1초당 */
  timeBonusPerSecond: 5,
  obstacleDamage: 75,
  obstacleClear: 120,
  specialClear: 60,
} as const;
