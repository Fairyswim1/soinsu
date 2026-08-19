export const scoringConfig = {
  /** 연결한 소수 보석 1개당 */
  gemScore: 100,
  /** 목표 숫자를 정확히 완성했을 때 */
  targetCompleteBonus: 500,
  /** 한 번의 드래그로 목표 숫자를 완성했을 때 */
  oneDragCompleteBonus: 300,
  /** 4개째 보석부터 추가되는 긴 연결 보너스 */
  longChainExtraPerGem: 100,
  objectiveBonus: 500,
  obstacleDamage: 0,
  obstacleClear: 0,
  specialClear: 0,
} as const;
