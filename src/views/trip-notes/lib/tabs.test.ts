import { describe, expect, it } from "vitest";

import { parseNoteTab } from "./tabs";

describe("parseNoteTab", () => {
  it("아는 탭은 그대로, 없거나 모르는 값은 체크리스트", () => {
    expect(parseNoteTab("voucher")).toBe("voucher");
    expect(parseNoteTab(null)).toBe("checklist");
    expect(parseNoteTab("todo")).toBe("checklist");
  });
});
