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
  moveBonus: 120,
  obstacleDamage: 75,
  specialClear: 60,
} as const;
