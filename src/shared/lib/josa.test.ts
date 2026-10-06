import { describe, expect, it } from "vitest";

import { eulReul, euro } from "./josa";

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

describe("eulReul", () => {
  it("받침이 있으면 「을」, 없으면 「를」", () => {
    expect(eulReul("금액")).toBe("을");
    expect(eulReul("카테고리")).toBe("를");
    expect(eulReul("항목명")).toBe("을");
  });

  it("한글로 끝나지 않으면 「을(를)」", () => {
    expect(eulReul("T3")).toBe("을(를)");
  });
});
