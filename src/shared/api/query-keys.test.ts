import { describe, expect, it } from "vitest";
import { queryKeys, shouldPersistQuery } from "./query-keys";

describe("shouldPersistQuery", () => {
  it("여행 데이터와 도시 기준 데이터는 남긴다", () => {
    expect(shouldPersistQuery(queryKeys.trips.all)).toBe(true);
    expect(shouldPersistQuery(queryKeys.scheduleItems("t1"))).toBe(true);
    expect(shouldPersistQuery(queryKeys.cities)).toBe(true);
  });

  it("경로와 사용자 정보는 남기지 않는다", () => {
    expect(shouldPersistQuery(queryKeys.dayRoute("t1", 0, "WALK"))).toBe(false);
    expect(shouldPersistQuery(queryKeys.user)).toBe(false);
    expect(shouldPersistQuery(queryKeys.myProfile)).toBe(false);
  });
});
