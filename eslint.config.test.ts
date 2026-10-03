import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const ROOT = __dirname;
/**
 * 디스크에 없는 가상 파일을 lint 한다. import/no-cycle 은 그런 파일에서 모듈 그래프를 못 만들고
 * 예외를 던지므로(eslint-plugin-import 2.32) 이 테스트에서만 끈다. 여기서 보는 건 경계 규칙이다.
 */
const eslint = new ESLint({ cwd: ROOT, overrideConfig: { rules: { "import/no-cycle": "off" } } });

/** `from` 위치의 가상 파일에서 `spec` 을 import 했을 때 경계 위반 메시지 */
async function boundaryErrors(from: string, spec: string) {
  const [result] = await eslint.lintText(`export * from "${spec}";\n`, {
    filePath: path.join(ROOT, from),
  });
  return result.messages.filter((m) => m.ruleId === "boundaries/element-types");
}

describe("같은 레이어의 슬라이스 경계", () => {
  it.each([
    ["src/features/expense/form/ui/x.ts", "@/features/trip/form", "다른 그룹의 같은 이름 슬라이스"],
    ["src/features/trip/form/ui/x.ts", "@/features/expense/form", "다른 그룹의 같은 이름 슬라이스"],
    ["src/features/trip/form/ui/x.ts", "@/features/trip/join", "같은 그룹의 다른 슬라이스"],
    ["src/widgets/bottom-nav/ui/x.ts", "@/widgets/trip-shell", "평면 슬라이스끼리"],
  ])("%s → %s 는 막힌다 (%s)", async (from, spec) => {
    expect(await boundaryErrors(from, spec)).toHaveLength(1);
  });

  it.each([
    ["src/features/trip/form/ui/x.ts", "../index"],
    ["src/widgets/bottom-nav/ui/x.ts", "../index"],
  ])("%s → %s 는 같은 슬라이스라 허용된다", async (from, spec) => {
    expect(await boundaryErrors(from, spec)).toEqual([]);
  });
});

/**
 * 그룹 이름으로 시작하는 평면 슬라이스가 검사에서 빠지면 안 된다.
 * 평면 패턴을 `!(trip|auth|…)` 로 쓰면 extglob 이 접두사까지 제외해서
 * `features/trip-foo` 가 어떤 element 에도 속하지 않고 검사가 통째로 꺼졌다.
 * 이름이 바로 이 형태였던 trip-form · expense-form 을 그룹으로 옮긴 참이라 재발하기 쉽다.
 */
describe("그룹 이름으로 시작하는 평면 슬라이스", () => {
  it.each([
    ["src/features/trip-foo/ui/x.ts", "@/views/trip-map", "상위 레이어"],
    ["src/features/expense-split/ui/x.ts", "@/views/trip-map", "상위 레이어"],
    ["src/features/trip-foo/ui/x.ts", "@/features/trip/form", "같은 레이어의 그룹 슬라이스"],
  ])("%s → %s 는 막힌다 (%s)", async (from, spec) => {
    expect(await boundaryErrors(from, spec)).toHaveLength(1);
  });
});

/** 다른 슬라이스의 내부 파일을 배럴(index.ts) 없이 가져오면 막는다 */
describe("슬라이스 공개 API", () => {
  async function restrictedErrors(from: string, spec: string) {
    const [result] = await eslint.lintText(`export * from "${spec}";\n`, {
      filePath: path.join(ROOT, from),
    });
    return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
  }

  it.each([
    ["src/views/trip-list/ui/x.ts", "@/entities/trip/ui/trip-row"],
    ["src/views/trip-list/ui/x.ts", "@/features/trip/create/ui/pc/pc-flow"],
    ["src/views/trip-list/ui/x.ts", "@/widgets/bottom-nav/ui/bottom-nav"],
    ["src/views/trip-map/ui/x.ts", "@/views/trip-map/ui/day-map"],
  ])("%s → %s 는 막힌다", async (from, spec) => {
    expect(await restrictedErrors(from, spec)).toHaveLength(1);
  });

  it.each([
    ["src/views/trip-list/ui/x.ts", "@/entities/trip"],
    ["src/views/trip-list/ui/x.ts", "@/features/trip/create"],
    ["src/views/trip-list/ui/x.ts", "@/shared/ui/button"],
    ["src/views/trip-list/ui/x.ts", "@/shared/api/supabase/client"],
  ])("%s → %s 는 공개 API 라 허용된다", async (from, spec) => {
    expect(await restrictedErrors(from, spec)).toEqual([]);
  });
});
