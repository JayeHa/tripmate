import { describe, expect, it } from "vitest";

import type { ChecklistItem } from "@/entities/checklist";
import type { Voucher } from "@/entities/voucher";

import { pinnedTodos, pinnedVouchers } from "./pinned-items";

const ctx = { tripId: "t1", startDate: "2026-10-31", today: "2026-10-27" };

/** 테스트용 할 일 */
function todo(
  id: string,
  pinned: boolean,
  status = "todo",
  due: string | null = null,
): ChecklistItem {
  return {
    id,
    title: id,
    status,
    due_date: due,
    body: "",
    pinned_by: pinned ? "u1" : null,
  } as ChecklistItem;
}

describe("pinnedTodos", () => {
  it("고정한 것만 — 안 끝난 것 먼저 · 마감 이른 순 · 마감 없는 것은 뒤, 완료도 남는다", () => {
    const rows = pinnedTodos(
      [
        todo("noDue", true),
        todo("done", true, "done", "2026-10-20"),
        todo("later", true, "todo", "2026-11-10"),
        todo("skip", false, "todo", "2026-10-27"),
        todo("today", true, "etc", "2026-10-27"),
      ],
      ctx,
    ).map((r) => ({ ...r, peek: undefined }));
    expect(rows).toEqual([
      {
        id: "today",
        title: "today",
        label: "체크리스트 · 10/27(화) · 오늘",
        soon: true,
        done: false,
      },
      {
        id: "later",
        title: "later",
        label: "체크리스트 · 11/10(화) · D-14",
        soon: false,
        done: false,
      },
      { id: "noDue", title: "noDue", label: "체크리스트", soon: false, done: false },
      { id: "done", title: "done", label: "체크리스트 · 완료", soon: false, done: true },
    ]);
  });
});

describe("pinnedVouchers", () => {
  it("고정한 바우처만, 무엇에 연결됐는지 · 미리 보기는 노트의 그 바우처", () => {
    const base = { schedule_item_id: null, flight_id: null, stay_id: null, numbers: [], memo: "" };
    const vouchers = [
      { ...base, id: "v1", title: "에어비앤비", stay_id: "s1", pinned_by: "u1", use_date: null },
      { ...base, id: "v2", title: "스카이트리", pinned_by: null, use_date: null },
      { ...base, id: "v3", title: "JR 패스", pinned_by: "u1", use_date: "2026-11-01" },
    ] as unknown as Voucher[];
    const rows = pinnedVouchers(vouchers, ctx);
    expect(rows.map((r) => [r.id, r.label])).toEqual([
      ["v1", "바우처 · 숙소"],
      ["v3", "바우처 · 기타"],
    ]);
    expect(rows[1].peek.facts).toEqual([{ label: "사용일", value: "11/1(일)" }]);
    expect(rows[1].peek.link.href).toBe("/trips/t1/notes?tab=voucher&open=v3");
  });
});
