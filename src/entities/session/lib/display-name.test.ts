import { describe, expect, it } from "vitest";

import { initialOfName, isValidDisplayName } from "./display-name";

describe("isValidDisplayName", () => {
  it.each(["정원", "Jayeha", "정원_2", "김 동규"])("%s 는 허용", (name) => {
    expect(isValidDisplayName(name)).toBe(true);
  });

  it.each(["", "   ", "정원!", "a".repeat(13), "🙂"])("%j 는 거부", (name) => {
    expect(isValidDisplayName(name)).toBe(false);
  });

  it("앞뒤 공백은 잘라서 본다", () => {
    expect(isValidDisplayName("  정원  ")).toBe(true);
  });
});

describe("initialOfName", () => {
  it("첫 글자", () => expect(initialOfName("정원")).toBe("정"));
  it("비어 있으면 물음표", () => expect(initialOfName(null)).toBe("?"));
});
