import { describe, expect, it } from "vitest";

import type { TaxRefund } from "@/entities/tax-refund";

import { canSaveDraft, detailRows, draftOf, fieldsOf, methodText } from "./refund-form";

const saved: TaxRefund = {
  id: "r",
  trip_id: "t",
  store: "AlpenTOKYO",
  provider: "JPrefund",
  site_url: "https://jprefund.com/home/1",
  transaction_id: "1776-9702",
  bought_on: "2026-11-01",
  bought_time: "17:01:00",
  currency: "JPY",
  amount: 27929,
  refund_amount: 1871,
  method: "cash",
  method_note: null,
  customs_at: null,
  received_at: null,
  memo: null,
  owner_id: "u2",
  barcode: "31158121628034678587",
  created_by: null,
  created_at: "1",
  updated_at: "1",
};

describe("택스 리펀 폼", () => {
  it("새 건은 오늘 · 시작 통화 · 카드로 시작하고, 매장이 있어야 저장한다", () => {
    const d = draftOf(null, "JPY", "2026-11-01", "me");
    expect(d).toMatchObject({
      boughtOn: "2026-11-01",
      currency: "JPY",
      method: "card",
      owner: "me",
    });
    expect(draftOf(null, "JPY", "2026-11-01", null).owner).toBe("");
    expect(canSaveDraft(d)).toBe(false);
    expect(canSaveDraft({ ...d, store: " 매장 " })).toBe(true);
  });

  it("저장된 건 → 폼 → 저장할 칸이 돌아온다(시각은 초를 떼고, 빈 칸은 null)", () => {
    const d = draftOf(saved, "KRW", "2026-11-02", "me");
    expect(d.boughtTime).toBe("17:01");
    expect(d.amount).toBe("27929");
    expect(fieldsOf(d)).toEqual({
      store: "AlpenTOKYO",
      provider: "JPrefund",
      site_url: "https://jprefund.com/home/1",
      transaction_id: "1776-9702",
      bought_on: "2026-11-01",
      bought_time: "17:01",
      currency: "JPY",
      amount: 27929,
      refund_amount: 1871,
      method: "cash",
      method_note: null,
      memo: null,
      owner_id: "u2",
      barcode: "31158121628034678587",
    });
  });

  it("날짜를 비우면 시각도 비우고, 금액 글자는 숫자로", () => {
    const d = draftOf(saved, "KRW", "2026-11-02", "me");
    const f = fieldsOf({
      ...d,
      boughtOn: "",
      amount: "1,000",
      refundAmount: "",
      methodNote: " 카운터 ",
    });
    expect(f.bought_on).toBeNull();
    expect(f.bought_time).toBeNull();
    expect(f.amount).toBe(1000);
    expect(f.refund_amount).toBeNull();
    expect(f.method_note).toBe("카운터");
  });

  it("환급 방법 글과 상세 표", () => {
    expect(methodText({ method: "card", method_note: "쿠팡 와우카드" })).toBe(
      "카드 · 쿠팡 와우카드",
    );
    expect(methodText({ method: "cash", method_note: null })).toBe("공항 현금");
    expect(methodText({ method: "??", method_note: null })).toBe("카드");
    const rows = detailRows(saved);
    expect(rows.map((r) => [r.label, r.value])).toEqual([
      ["사업자", "JPrefund"],
      ["환급 방법", "공항 현금"],
      ["구매", "11.1 (일) 17:01"],
      ["구매 금액", "¥27,929"],
      ["환급 예정", "¥1,871"],
      ["거래번호", "1776-9702"],
      ["신청 사이트", "https://jprefund.com/home/1"],
      ["메모", null],
    ]);
    expect(rows[6].href).toBe("https://jprefund.com/home/1");
    expect(detailRows(saved, "김동규")[0]).toEqual({ label: "누구 것", value: "김동규" });
    expect(detailRows(saved, null)[0]).toEqual({ label: "누구 것", value: null });
    expect(detailRows({ ...saved, site_url: "jprefund.com" })[6].href).toBeUndefined();
  });
});
