import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GROUPS, SEGMENTS, SLICED } from "../fsd.config.mjs";

const SRC = path.resolve(__dirname, "../src");

const dirsIn = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).filter((n) => statSync(path.join(dir, n)).isDirectory()) : [];

/** 슬라이스는 index.ts 나 세그먼트 폴더를 갖는다. 그룹은 둘 다 없다. */
function isSlice(dir: string) {
  return (
    existsSync(path.join(dir, "index.ts")) || SEGMENTS.some((s) => existsSync(path.join(dir, s)))
  );
}

/** 레이어 아래에서 실제로 그룹 노릇을 하는 폴더 이름 */
function actualGroups(layer: string) {
  const layerDir = path.join(SRC, layer);
  return dirsIn(layerDir).filter((name) => !isSlice(path.join(layerDir, name)));
}

describe.each(SLICED)("%s 레이어", (layer) => {
  const registered: string[] = (GROUPS as Record<string, string[]>)[layer] ?? [];

  it("그룹 폴더가 모두 fsd.config.mjs 의 GROUPS 에 등록돼 있다", () => {
    // 등록하지 않으면 ESLint 가 그룹을 슬라이스로 착각해
    // 그룹 안의 교차 import 를 조용히 통과시킨다.
    expect([...actualGroups(layer)].sort()).toEqual([...registered].sort());
  });

  it.each(registered)("그룹 %s 는 코드를 직접 갖지 않는다", (group) => {
    // FSD: "there should be no code sharing in that folder"
    const files = existsSync(path.join(SRC, layer, group))
      ? readdirSync(path.join(SRC, layer, group)).filter((n) =>
          statSync(path.join(SRC, layer, group, n)).isFile(),
        )
      : [];
    expect(files).toEqual([]);
  });
});
