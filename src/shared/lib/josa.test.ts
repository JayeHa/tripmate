import { describe, expect, it } from "vitest";

import { euro } from "./josa";

describe("euro", () => {
  it("받침 없음 · ㄹ 받침은 「로」, 그 밖 받침은 「으로」", () => {
    expect(euro("다이소")).toBe("로");
    expect(euro("우에노 공원")).toBe("으로");
    expect(euro("신주쿠 교엔 정원")).toBe("으로");
    expect(euro("하라주쿠 거리 ")).toBe("로");
    expect(euro("스카이트리 전망대 2층 매장 매점 물")).toBe("로");
  });

  it("한글로 끝나지 않거나 비면 「(으)로」", () => {
    expect(euro("나리타 T3")).toBe("(으)로");
    expect(euro("치이카와 라멘 豚")).toBe("(으)로");
    expect(euro("")).toBe("(으)로");
  });
});
