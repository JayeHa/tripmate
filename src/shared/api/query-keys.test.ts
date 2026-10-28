import { describe, expect, it } from "vitest";

import { queryKeys, shouldPersistQuery } from "./query-keys";

describe("shouldPersistQuery", () => {
  it("여행 데이터와 도시 기준 데이터는 남긴다", () => {
    expect(shouldPersistQuery(queryKeys.trips.all)).toBe(true);
    expect(shouldPersistQuery(queryKeys.scheduleItems("t1"))).toBe(true);
    expect(shouldPersistQuery(queryKeys.cities)).toBe(true);
    expect(shouldPersistQuery(queryKeys.holidays("JP", 2026))).toBe(true);
    expect(shouldPersistQuery(queryKeys.weather.forecast(35.68, 139.65))).toBe(true);
  });

  it("경로와 사용자 정보는 남기지 않는다", () => {
    expect(shouldPersistQuery(queryKeys.dayRoute("t1", 0, "WALK"))).toBe(false);
    expect(shouldPersistQuery(queryKeys.user)).toBe(false);
    expect(shouldPersistQuery(queryKeys.myProfile)).toBe(false);
    // 실시간 환율은 참고용 — 오프라인에서는 「지금」 값을 빼고 그린다
    expect(shouldPersistQuery(queryKeys.liveRates("KRW"))).toBe(false);
  });

  it("영수증 · 바우처 줄은 남기고, 만료되는 읽기 주소는 남기지 않는다", () => {
    expect(shouldPersistQuery(queryKeys.receipts("t1"))).toBe(true);
    expect(shouldPersistQuery([...queryKeys.receipts("t1"), "urls", "t1/a.jpg"])).toBe(false);
    expect(shouldPersistQuery(queryKeys.vouchers("t1"))).toBe(true);
    expect(shouldPersistQuery([...queryKeys.vouchers("t1"), "urls", "t1/a.pdf"])).toBe(false);
    expect(shouldPersistQuery([...queryKeys.packPhotos("t1"), "urls", "t1/a.jpg"])).toBe(false);
  });
});
