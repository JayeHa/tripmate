import path from "node:path";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";

const ROOT = __dirname;
/**
 * 디스크에 없는 가상 파일을 lint 한다. 그런 파일은 tsconfig 프로젝트에 없어 타입 기반 규칙이
 * 파싱부터 실패하고, import/no-cycle 은 모듈 그래프를 못 만들어 예외를 던진다(eslint-plugin-import 2.32).
 * 이 테스트에서만 둘 다 끈다. 여기서 보는 건 경계 · import · Tailwind 규칙이다.
 */
const eslint = new ESLint({
  cwd: ROOT,
  overrideConfig: [tseslint.configs.disableTypeChecked, { rules: { "import/no-cycle": "off" } }],
});

/** `from` 위치의 가상 파일에서 `spec` 을 import 했을 때 경계 위반 메시지 */
async function boundaryErrors(from: string, spec: string) {
  const [result] = await eslint.lintText(`export * from "${spec}";\n`, {
    filePath: path.join(ROOT, from),
  });
  return result.messages.filter((m) => m.ruleId === "boundaries/element-types");
}

describe("같은 레이어의 슬라이스 경계", () => {
  it.each([
    ["src/features/expense/form/ui/x.ts", "@/features/trip/create", "다른 그룹의 슬라이스"],
    ["src/features/trip/form/ui/x.ts", "@/features/expense/form", "다른 그룹의 같은 이름 슬라이스"],
    ["src/features/trip/form/ui/x.ts", "@/features/trip/join", "같은 그룹의 다른 슬라이스"],
    ["src/widgets/bottom-nav/ui/x.ts", "@/widgets/trip-shell", "평면 슬라이스끼리"],
  ])("%s → %s 는 막힌다 (%s)", async (from, spec) => {
    expect(await boundaryErrors(from, spec)).toHaveLength(1);
  });

  it.each([
    ["src/features/trip/create/ui/x.ts", "../index"],
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
    ["src/features/trip-foo/ui/x.ts", "@/features/trip/create", "같은 레이어의 그룹 슬라이스"],
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
    // 상대경로로 우회해도 막힌다
    ["src/views/trip-list/ui/x.ts", "../../../entities/trip/ui/trip-row"],
    ["src/features/trip/create/ui/x.ts", "../../../../shared/ui/button"],
  ])("%s → %s 는 막힌다", async (from, spec) => {
    expect(await restrictedErrors(from, spec)).toHaveLength(1);
  });

  it.each([
    ["src/views/trip-list/ui/x.ts", "@/entities/trip"],
    ["src/views/trip-list/ui/x.ts", "@/features/trip/create"],
    ["src/views/trip-list/ui/x.ts", "@/shared/ui/button"],
    ["src/views/trip-list/ui/x.ts", "@/shared/api/supabase/client"],
    // 같은 슬라이스 안의 상대경로
    ["src/features/trip/create/ui/pc/x.ts", "../../lib/cta"],
    ["src/views/trip-list/ui/x.ts", "./trip-actions-menu"],
  ])("%s → %s 는 공개 API 라 허용된다", async (from, spec) => {
    expect(await restrictedErrors(from, spec)).toEqual([]);
  });
});

/**
 * Tailwind 정식 클래스. VS Code 확장만 보던 것을 린트가 잡는다.
 * 첫 lint 가 globals.css 로 디자인 시스템을 만든다(로컬 약 2초). CI 는 워커가 동시에 돌아 기본 5초를 넘긴 적이 있다.
 */
describe("Tailwind 정식 클래스", { timeout: 20_000 }, () => {
  async function canonicalErrors(className: string) {
    const [result] = await eslint.lintText(
      `export const A = () => <i className="${className}" />;\n`,
      {
        filePath: path.join(ROOT, "src/shared/ui/x.tsx"),
      },
    );
    return result.messages.filter(
      (m) => m.ruleId === "better-tailwindcss/enforce-canonical-classes",
    );
  }

  it("px 임의값이 간격 단위로 바뀌면 막힌다", async () => {
    expect(await canonicalErrors("size-[22px]")).toHaveLength(1);
  });

  it("정식 클래스와 대응 클래스가 없는 임의값은 통과한다", async () => {
    expect(await canonicalErrors("size-5.5 text-[13px]")).toEqual([]);
  });
});

/** 컴포넌트 props 타입은 이름을 붙여 따로 선언한다 */
describe("컴포넌트 props 타입", () => {
  async function propsErrors(code: string) {
    const [result] = await eslint.lintText(code, {
      filePath: path.join(ROOT, "src/shared/ui/x.tsx"),
    });
    return result.messages.filter((m) => m.ruleId === "no-restricted-syntax");
  }

  it.each([
    "export function A({ a }: { a: string }) { return <i>{a}</i>; }",
    "export function A(props: { a: string }) { return <i>{props.a}</i>; }",
    "export const A = ({ a }: { a: string }) => <i>{a}</i>;",
  ])("인라인 타입은 막힌다: %s", async (code) => {
    expect(await propsErrors(code)).toHaveLength(1);
  });

  it.each([
    "type AProps = { a: string };\nexport function A({ a }: AProps) { return <i>{a}</i>; }",
    // 훅·유틸의 객체 파라미터는 대상이 아니다
    "export function useA({ a }: { a: string }) { return a; }",
  ])("허용된다: %s", async (code) => {
    expect(await propsErrors(code)).toEqual([]);
  });
});

/** 시간 칸은 TimeField 로만 — 브라우저 기본 시간 입력은 막는다 */
describe("시간 입력", () => {
  async function timeErrors(code: string) {
    const [result] = await eslint.lintText(code, {
      filePath: path.join(ROOT, "src/shared/ui/x.tsx"),
    });
    return result.messages.filter((m) => m.ruleId === "no-restricted-syntax");
  }

  it("input type=time 은 막히고, 다른 input 은 통과한다", async () => {
    expect(await timeErrors(`export const A = () => <input type="time" />;\n`)).toHaveLength(1);
    expect(await timeErrors(`export const A = () => <input type="text" />;\n`)).toEqual([]);
  });
});
