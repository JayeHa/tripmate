import { describe, expect, it } from "vitest";

import { detailDateText, paymentStatusText } from "./detail";

const trip = { start_date: "2026-10-29", end_date: "2026-11-02" };

describe("detailDateText", () => {
  it("날짜가 없으면 여행준비", () => {
    expect(detailDateText(null, trip)).toBe("여행준비");
  });

  it("여행 며칠째와 그 날짜", () => {
    expect(detailDateText("2026-10-30", trip)).toBe("day 2 · 10.30 (금)");
  });

  it("기간 밖 날짜는 day 없이 그 날짜 그대로", () => {
    expect(detailDateText("2026-10-27", trip)).toBe("10.27 (화)");
    expect(detailDateText("2026-11-10", trip)).toBe("11.10 (화)");
  });

  it("마지막 날은 기간 안", () => {
    expect(detailDateText("2026-11-02", trip)).toBe("day 5 · 11.2 (월)");
  });
});

describe("paymentStatusText", () => {
  it("결제 완료", () => {
    expect(paymentStatusText(true, null)).toBe("결제 완료");
  });

  it("예정일이 있으면 월/일", () => {
    expect(paymentStatusText(false, "2026-11-02")).toBe("11/2 결제 예정");
  });

  it("예정일이 없으면 결제 예정", () => {
    expect(paymentStatusText(false, null)).toBe("결제 예정");
  });
});
