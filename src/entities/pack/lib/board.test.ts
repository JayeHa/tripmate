import { describe, expect, it } from "vitest";

import type { PackGroup, PackItem } from "../model/types";
import { nextPosition, packBoard, packCountText } from "./board";

/** 그룹 한 줄 */
const group = (id: string, kind: string, position: number) =>
  ({ id, kind, position, name: id }) as PackGroup;
/** 항목 한 줄 */
const item = (id: string, group_id: string, checked = false) =>
  ({ id, group_id, checked_at: checked ? "2027-10-30T00:00:00Z" : null }) as PackItem;

describe("packBoard", () => {
  const lists = {
    groups: [group("g1", "pack", 0), group("s1", "shop", 0), group("g2", "pack", 1)],
    items: [item("a", "g1", true), item("b", "g1"), item("c", "s1", true), item("d", "g2", true)],
  };

  it("그 종류의 그룹만, 받은 순서대로 항목을 묶고 챙긴 수를 센다(체크해도 자리 그대로)", () => {
    const board = packBoard(lists, "pack");
    expect(
      board.groups.map((g) => [g.group.id, g.items.map((i) => i.id), g.done, g.total]),
    ).toEqual([
      ["g1", ["a", "b"], 1, 2],
      ["g2", ["d"], 1, 1],
    ]);
    expect(packCountText(board)).toBe("2/3");
    expect(packCountText(packBoard(lists, "shop"))).toBe("1/1");
  });

  it("맨 뒤 순서 — 가장 큰 position + 1, 없으면 0", () => {
    expect(nextPosition(lists.groups)).toBe(2);
    expect(nextPosition([])).toBe(0);
  });
});
