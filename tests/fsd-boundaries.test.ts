import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const eslint = new ESLint({ cwd: ROOT });

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
