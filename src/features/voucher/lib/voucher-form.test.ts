import { describe, expect, it } from "vitest";

import type { Voucher } from "@/entities/voucher";

import {
  blankVoucherForm,
  changedFields,
  hasMoreValues,
  newNumber,
  normalizePages,
  pagesInput,
  toVoucherFields,
  voucherFormFrom,
} from "./voucher-form";

describe("현장용 페이지 글자", () => {
  it("한 모양으로 — 띄어쓰기 · 빈 칸을 정리하고, 비면 「1」", () => {
    expect(normalizePages("2,1 ")).toBe("2, 1");
    expect(normalizePages(" 1 , , 3")).toBe("1, 3");
    expect(normalizePages("")).toBe("1");
    expect(normalizePages(" , ")).toBe("1");
  });

  it("숫자 · 쉼표 · 띄어쓰기만 받는다(40자까지)", () => {
    expect(pagesInput("1-3, 5쪽")).toBe("13, 5");
    expect(pagesInput("1,".repeat(30))).toHaveLength(40);
  });
});

describe("toVoucherFields", () => {
  const base = { ...blankVoucherForm(), title: "  입장권 " };

  it("앞뒤 공백을 버리고, 값이 빈 번호 줄은 뺀다", () => {
    const r = toVoucherFields({
      ...base,
      numbers: [
        { ...newNumber(0), value: " K7QX2M " },
        { ...newNumber(1), value: "  " },
      ],
      memo: " 미팅 장소 ",
    });
    expect(r.ok && r.fields).toMatchObject({
      title: "입장권",
      pages: "1",
      numbers: [{ label: "예약번호", owner: "", value: "K7QX2M" }],
      memo: "미팅 장소",
      schedule_item_id: null,
      use_date: null,
    });
  });

  it("사용일은 연결이 없을 때만 남긴다(DB 검사)", () => {
    const withDate = { ...base, useDate: "2026-10-21" };
    expect(toVoucherFields(withDate)).toMatchObject({
      ok: true,
      fields: { use_date: "2026-10-21" },
    });
    expect(toVoucherFields({ ...withDate, target: { kind: "flight", id: "f1" } })).toMatchObject({
      ok: true,
      fields: { use_date: null, flight_id: "f1" },
    });
  });

  it("거부: 제목이 비었거나 예약 사이트 주소가 http(s) 가 아니다", () => {
    expect(toVoucherFields({ ...base, title: "  " })).toEqual({
      ok: false,
      error: "제목을 입력해 주세요",
    });
    expect(toVoucherFields({ ...base, siteUrl: "klook.com" }).ok).toBe(false);
    expect(toVoucherFields({ ...base, siteUrl: "https://klook.com" }).ok).toBe(true);
  });
});

describe("수정", () => {
  const saved = {
    title: "입장권",
    pages: "1, 3",
    owners: ["u1"],
    numbers: [{ label: "예약번호", owner: "", value: "K7" }, "nope"],
    schedule_item_id: null,
    flight_id: null,
    stay_id: "h1",
    use_date: null,
    site_title: "",
    site_url: "",
    memo: "",
  } as unknown as Voucher;

  it("저장된 바우처 → 폼 값(모양이 다른 번호는 빼고), 추가 정보에 값이 있으면 펼친다", () => {
    const v = voucherFormFrom(saved);
    expect(v.target).toEqual({ kind: "stay", id: "h1" });
    expect(v.numbers.map((n) => n.value)).toEqual(["K7"]);
    expect(hasMoreValues(v)).toBe(true);
    expect(hasMoreValues(blankVoucherForm())).toBe(false);
  });

  it("연 때와 달라진 칸만 보낸다 — 번호 줄의 uid 는 비교하지 않는다", () => {
    const initial = voucherFormFrom(saved);
    const before = toVoucherFields(initial);
    const now = toVoucherFields({ ...initial, title: "입장권 2인", target: null });
    if (!before.ok || !now.ok) throw new Error("검사 실패");
    expect(changedFields(now.fields, before.fields)).toEqual({
      title: "입장권 2인",
      stay_id: null,
    });
    expect(changedFields(before.fields, before.fields)).toEqual({});
  });
});
