# 넘버 브레이크 : 수의 분해

중학교 1학년 소인수분해 복습을 위한 2D 퍼즐 웹게임입니다. 문제를 읽고 답을 고르는 퀴즈가 아니라, 보드의 소수 타일을 직접 연결해 목표 숫자를 쪼개는 플레이 자체가 소인수분해가 되도록 구성했습니다.

## 교육 목표

- 소수와 합성수를 구분합니다.
- 목표 수를 소수로 반복해서 나누는 구조를 익힙니다.
- 선택 순서와 관계없이 같은 소인수분해 정규형이 나온다는 점을 확인합니다.
- 반복되는 소수는 지수로 묶어 표현합니다.

## 실행 방법

```bash
npm install
npm run dev
```

## 빌드와 검사

```bash
npm run lint
npm run test
npm run build
npm run preview
```

## 폴더 구조

- `src/main.ts`: Phaser 게임 시작점
- `src/game/scenes`: Boot, Menu, LevelSelect, Tutorial, Game, QuickPractice, Classroom, Result, Settings 장면
- `src/game/systems`: 소인수분해 판정, 보드 생성, 선택, 점수, 힌트, 장애물, 저장, 오디오
- `src/game/config`: 레벨, 테마, 점수, 에셋 manifest
- `src/game/models`: 보드, 사탕, 레벨, 장애물, 세션 타입
- `src/tests`: 순수 TypeScript 로직 단위 테스트
- `public/assets`: 실제 이미지와 음원 교체 위치

## 레벨 데이터 수정

`src/game/config/levels.ts`에서 스테이지 도전 데이터를 수정합니다. 각 스테이지는 다음 값을 가집니다.

- `targets`: 목표 수 목록
- `moves`: 이동 횟수
- `availablePrimes`: 보드에 등장할 소수
- `obstacles`: 합성수 얼음 또는 소수 자물쇠 배치
- `starThresholds`: 별 1~3개 점수 기준
- `hintPolicy`, `wrongDragPenalty`, `specialsEnabled`
- `boardTuning`: 유효 소수 밀도와 인접 배치 억제 정도

## 목표 수 추가

목표 수는 `targets` 배열에 추가합니다. 현재 구현은 소수 타일 `2, 3, 5, 7, 11`을 지원하므로, 목표 수는 이 소수들의 곱으로 구성하는 것이 좋습니다.

## 에셋 교체

최종 이미지가 없어도 게임은 Phaser Graphics로 만든 fallback texture로 실행됩니다. 실제 에셋을 넣을 때는 `public/assets` 아래에 파일을 추가하고 `src/game/config/assetManifest.ts`의 키와 경로를 맞춥니다.

## 음원 교체

음원 파일이 없으면 Web Audio API로 임시 효과음을 생성합니다. 실제 음원은 `public/assets/audio`에 넣고 `assetManifest.ts`에 등록합니다.

## 수학 판정 규칙

- `currentRemainder % selectedPrime === 0`인 소수만 연결됩니다.
- 1은 소수로 처리하지 않습니다.
- 부분 연결이 가능하며, 선택한 소수의 곱만큼 현재 남은 수를 갱신합니다.
- 완료식은 선택 순서와 무관하게 오름차순 정규형으로 표시합니다.
- 특수 타일 효과로 제거된 타일은 점수와 장애물에는 반영되지만, 소인수 기록에는 반영하지 않는 정책입니다.

## 알려진 제한 사항

- 현재 에셋은 모두 코드 생성 fallback입니다.
- 교실 모드는 빠른 사용을 위한 간단한 팀 교대 흐름입니다.
- 보드 전체 키보드 조작은 우선순위에서 제외했고, 메뉴와 설정의 클릭/터치 접근성을 우선 구현했습니다.

## 성취기준 확인

게임의 `성취기준 확인 · 기록`에서 독립 확인 과제, 도움/재시도 구분, 학생 설명과 교사 검토, JSON 내보내기·인쇄를 제공합니다. 기준·범위·출처는 `assessment.json`에 있습니다. 기록은 해당 기기의 브라우저에만 저장되며 게임 점수와 별개입니다. 공식 이수나 성적을 자동 판정하지 않습니다. 학교 평가와 함께 사용할 형성평가 증거입니다.

## 공통 게임 서체

넘버 트레일·넘버 브레이크를 기준으로 제목 Jua, 버튼·숫자 Do Hyeon, 설명 Gowun Dodum의 역할을 사용합니다. 기존 두 게임의 고유 화면은 유지하고 추가 학습 화면에도 같은 서체를 적용합니다. WOFF2 글꼴과 SIL OFL 라이선스는 `public/theme/fonts/`에 포함되어 있습니다. 원본 출처와 변환 정보는 `SOURCES.txt`를 참고하세요.
