import { describe, expect, it } from "vitest";

import type { PackGroup, PackItem } from "../model/types";
import { nextPosition, packBoard, packCountText, packItemPatch } from "./board";

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

describe("packItemPatch", () => {
  const NOW = "2027-10-31T09:00:00Z";
  const base = {
    ...item("i1", "g1", true),
    name: "여권",
    memo: "",
    position: 0,
    checked_by: "friend",
  } as PackItem;
  const all = [base, { ...item("i2", "g2"), position: 4 }];
  const draft = { name: "여권", memo: "", groupId: "g1", checked: true };

  it("바뀐 것이 없으면 빈 객체 — 챙긴 사람 · 시각은 그대로", () => {
    expect(packItemPatch(base, { ...draft, name: " 여권 " }, all, "me", NOW)).toEqual({});
  });

  it("이름 · 메모는 공백을 떼고, 다른 그룹으로 옮기면 그 그룹 맨 뒤", () => {
    expect(
      packItemPatch(
        base,
        { ...draft, name: "여권 사본", memo: " 기내 ", groupId: "g2" },
        all,
        "me",
        NOW,
      ),
    ).toEqual({ name: "여권 사본", memo: "기내", group_id: "g2", position: 5 });
  });

  it("챙김 — 풀면 둘 다 비우고, 챙기면 나와 지금 시각", () => {
    expect(packItemPatch(base, { ...draft, checked: false }, all, "me", NOW)).toEqual({
      checked_by: null,
      checked_at: null,
    });
    const unchecked = { ...base, checked_at: null, checked_by: null };
    expect(packItemPatch(unchecked, draft, all, "me", NOW)).toEqual({
      checked_by: "me",
      checked_at: NOW,
    });
  });
});
