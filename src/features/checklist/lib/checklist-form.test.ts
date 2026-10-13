import { describe, expect, it } from "vitest";

import type { ChecklistItem } from "@/entities/checklist";

import {
  blankChecklistForm,
  checklistFormFrom,
  targetChanges,
  toChecklistFields,
  toChecklistPatch,
} from "./checklist-form";

/** 저장된 항목 하나 */
const saved = {
  status: "etc",
  title: "환전",
  due_date: "2026-10-20",
  body: "공항 말고 시내에서",
  links: [{ title: "환율", url: "https://example.com" }, { nope: 1 }],
  pinned_by: "u-friend",
} as unknown as ChecklistItem;

describe("checklist form", () => {
  it("새 항목은 해야 할 것 · 빠른 추가에 치던 제목", () => {
    expect(blankChecklistForm("  여권  ")).toEqual({
      status: "todo",
      title: "여권",
      due: "",
      body: "",
      links: [],
      pinned: false,
      targets: [],
    });
  });

  it("저장된 항목을 폼으로 — 모양이 다른 링크는 뺀다", () => {
    expect(checklistFormFrom(saved, [])).toEqual({
      status: "etc",
      title: "환전",
      due: "2026-10-20",
      body: "공항 말고 시내에서",
      links: [{ title: "환율", url: "https://example.com" }],
      pinned: true,
      targets: [],
    });
  });

  it("저장 칸 — 앞뒤 공백 · 빈 링크 줄을 버리고, 빈 마감은 null", () => {
    const r = toChecklistFields(
      {
        ...blankChecklistForm(" 여권 "),
        body: "  ",
        links: [
          { title: " 대사관 ", url: " https://a.example " },
          { title: "빈 줄", url: " " },
        ],
      },
      "u-me",
    );
    expect(r).toEqual({
      ok: true,
      fields: {
        status: "todo",
        title: "여권",
        due_date: null,
        body: "",
        links: [{ title: "대사관", url: "https://a.example" }],
        pinned_by: null,
      },
    });
  });

  it("편집 — 연 때와 달라진 칸만 보낸다(상태 · 고정은 건드리지 않으면 빠진다)", () => {
    const opened = checklistFormFrom(saved, []);
    expect(toChecklistPatch(opened, opened, "u-me")).toEqual({ ok: true, patch: {} });
    expect(toChecklistPatch({ ...opened, title: " 환전하기 " }, opened, "u-me")).toEqual({
      ok: true,
      patch: { title: "환전하기" },
    });
    expect(toChecklistPatch({ ...opened, pinned: false }, opened, "u-me")).toEqual({
      ok: true,
      patch: { pinned_by: null },
    });
    expect(
      toChecklistPatch({ ...opened, pinned: false }, { ...opened, pinned: false }, "u-me"),
    ).toEqual({
      ok: true,
      patch: {},
    });
    expect(
      toChecklistPatch({ ...opened, pinned: true }, { ...opened, pinned: false }, "u-me"),
    ).toEqual({ ok: true, patch: { pinned_by: "u-me" } });
    expect(toChecklistPatch({ ...opened, title: " " }, opened, "u-me")).toMatchObject({
      ok: false,
    });
  });

  it("제목이 비었거나 링크가 http(s) 가 아니면 저장하지 않는다", () => {
    expect(toChecklistFields(blankChecklistForm("  "), "u")).toEqual({
      ok: false,
      error: "제목을 입력해 주세요",
    });
    expect(
      toChecklistFields(
        { ...blankChecklistForm("여권"), links: [{ title: "", url: "example.com" }] },
        "u",
      ),
    ).toMatchObject({ ok: false });
  });

  it("연결 — 연 때에 없던 것은 더하고, 빠진 것은 뺀다", () => {
    const a = { kind: "schedule_item", id: "a" } as const;
    const b = { kind: "flight", id: "b" } as const;
    const c = { kind: "stay", id: "c" } as const;
    expect(targetChanges([a, c], [a, b])).toEqual({ add: [c], remove: [b] });
    expect(targetChanges([a], [a])).toEqual({ add: [], remove: [] });
  });
});
