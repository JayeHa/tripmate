/**
 * FSD 레이어와 슬라이스 그룹 정의.
 * eslint.config.mjs 와 tests/fsd-structure.test.ts 가 함께 읽는다.
 */

/** 슬라이스를 갖는 레이어. 위에서 아래로만 import 할 수 있다. */
export const SLICED = ["views", "widgets", "features", "entities"];
export const ORDER = ["app", ...SLICED, "shared"];

/** 세그먼트 이름. 이 폴더가 있으면 슬라이스, 없으면 그룹이다. */
export const SEGMENTS = ["ui", "model", "api", "lib", "config"];

/**
 * 그룹된 슬라이스. 가까운 슬라이스를 폴더로 묶되 그룹 자체는 코드를 갖지 않고,
 * 그룹 안의 슬라이스끼리도 서로 import 할 수 없다 (FSD: slices-segments).
 *
 * 새 그룹을 만들면 반드시 여기에 추가한다. 적지 않으면 ESLint 가 그룹을 슬라이스로
 * 착각해서 그룹 안의 교차 import 를 조용히 통과시킨다.
 * tests/fsd-structure.test.ts 가 누락을 잡는다.
 */
export const GROUPS = {
  features: ["auth", "trip", "schedule", "expense"],
};
