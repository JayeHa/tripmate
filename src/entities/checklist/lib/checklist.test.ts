import { describe, expect, it } from "vitest";

import type { ChecklistItem } from "../model/types";
import { dueReadView, dueView } from "./due";
import { checklistGroups, openCount, toggledStatus } from "./groups";

/** 상태 · 마감 · 넣은 시각만 있는 항목 */
const item = (id: string, status: string, due: string | null, created = "2026-10-01T00:00:00Z") =>
  ({ id, status, due_date: due, created_at: created }) as ChecklistItem;

describe("checklistGroups", () => {
  it("해야 할 것 → 기타 → 완료, 마감순(없는 것은 뒤 · 같으면 최근 것 위), 빈 묶음은 뺀다", () => {
    const groups = checklistGroups([
      item("a", "todo", null, "2026-10-01T00:00:00Z"),
      item("b", "todo", "2026-10-10"),
      item("c", "done", null),
      item("d", "todo", null, "2026-10-02T00:00:00Z"),
      item("e", "todo", "2026-10-05"),
    ]);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ["해야 할 것", ["e", "b", "d", "a"]],
      ["완료", ["c"]],
    ]);
  });

  it("남은 수는 완료가 아닌 것, 체크하면 완료 ↔ 해야 할 것(기타도 완료로)", () => {
    expect(
      openCount([item("a", "todo", null), item("b", "etc", null), item("c", "done", null)]),
    ).toBe(2);
    expect([toggledStatus("todo"), toggledStatus("etc"), toggledStatus("done")]).toEqual([
      "done",
      "done",
      "todo",
    ]);
  });
});

describe("dueView", () => {
  it("「M/D(요일) · D-N」, 7일 안이거나 지났으면 주황", () => {
    expect(dueView("2026-10-10", "2026-10-03")).toEqual({ text: "10/10(토) · D-7", soon: true });
    expect(dueView("2026-10-11", "2026-10-03")).toEqual({ text: "10/11(일) · D-8", soon: false });
    expect(dueView("2026-10-03", "2026-10-03").text).toBe("10/3(토) · 오늘");
    expect(dueView("2026-10-01", "2026-10-03")).toEqual({ text: "10/1(목) · 지남", soon: true });
  });
});

describe("dueReadView", () => {
  it("「M/D(요일) 까지 · D-N」, 완료면 D-day · 주황 없이", () => {
    expect(dueReadView("2026-10-16", "2026-10-13", false)).toEqual({
      text: "10/16(금) 까지 · D-3",
      soon: true,
    });
    expect(dueReadView("2026-11-30", "2026-10-13", false).soon).toBe(false);
    expect(dueReadView("2026-10-16", "2026-10-13", true)).toEqual({
      text: "10/16(금) 까지",
      soon: false,
    });
  });
});
