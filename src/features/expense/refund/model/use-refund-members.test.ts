import { describe, expect, it } from "vitest";

import { memberName } from "./use-refund-members";

describe("memberName", () => {
  it("id 로 이름, 없으면 나간 멤버, 비면 null", () => {
    const members = [{ id: "a", name: "정원" }];
    expect(memberName(members, "a")).toBe("정원");
    expect(memberName(members, "b")).toBe("나간 멤버");
    expect(memberName(members, null)).toBeNull();
  });
});
