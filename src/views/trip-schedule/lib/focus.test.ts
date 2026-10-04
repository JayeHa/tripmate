import { describe, expect, it } from "vitest";

import { pickFocus } from "./focus";

const rows = [
  { id: "a", top: 100 },
  { id: "b", top: 300 },
  { id: "c", top: 500 },
];

describe("pickFocus", () => {
  it("기준선을 지난 마지막 행", () => {
    expect(pickFocus(rows, 350)).toBe("b");
  });

  it("윗변이 기준선과 같으면 지난 것으로 본다", () => {
    expect(pickFocus(rows, 500)).toBe("c");
  });

  it("아무것도 지나지 않았으면 첫 행", () => {
    expect(pickFocus(rows, 50)).toBe("a");
  });

  it("후보가 없으면 null", () => {
    expect(pickFocus([], 200)).toBeNull();
  });
});
