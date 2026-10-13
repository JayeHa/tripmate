import { describe, expect, it } from "vitest";

import type { ChecklistItem } from "@/entities/checklist";

import { blankChecklistForm, checklistFormFrom, toChecklistFields } from "./checklist-form";

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
    });
  });

  it("저장된 항목을 폼으로 — 모양이 다른 링크는 뺀다", () => {
    expect(checklistFormFrom(saved)).toEqual({
      status: "etc",
      title: "환전",
      due: "2026-10-20",
      body: "공항 말고 시내에서",
      links: [{ title: "환율", url: "https://example.com" }],
      pinned: true,
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
      null,
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

  it("고정 — 새로 고정하면 나, 이미 고정된 것은 처음 고정한 사람", () => {
    const form = { ...checklistFormFrom(saved) };
    const pinnedBy = (before: string | null) => {
      const r = toChecklistFields(form, "u-me", before);
      return r.ok ? r.fields.pinned_by : "error";
    };
    expect(pinnedBy(null)).toBe("u-me");
    expect(pinnedBy("u-friend")).toBe("u-friend");
    expect(toChecklistFields({ ...form, pinned: false }, "u-me", "u-friend")).toMatchObject({
      ok: true,
      fields: { pinned_by: null },
    });
  });

  it("제목이 비었거나 링크가 http(s) 가 아니면 저장하지 않는다", () => {
    expect(toChecklistFields(blankChecklistForm("  "), "u", null)).toEqual({
      ok: false,
      error: "제목을 입력해 주세요",
    });
    expect(
      toChecklistFields(
        { ...blankChecklistForm("여권"), links: [{ title: "", url: "example.com" }] },
        "u",
        null,
      ),
    ).toMatchObject({ ok: false });
  });
});
