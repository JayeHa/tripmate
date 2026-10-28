import { describe, expect, it } from "vitest";

import { parseNoteTab } from "./tabs";

describe("parseNoteTab", () => {
  it("아는 탭은 그대로, 없거나 모르는 값은 바우처(첫 탭)", () => {
    expect(parseNoteTab("checklist")).toBe("checklist");
    expect(parseNoteTab(null)).toBe("voucher");
    expect(parseNoteTab("todo")).toBe("voucher");
  });
});
