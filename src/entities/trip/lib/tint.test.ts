import { describe, expect, it } from "vitest";
import { initialOf, tintOf } from "./tint";

describe("tintOf", () => {
  it("같은 제목이면 같은 색", () => {
    expect(tintOf("도쿄 여행")).toBe(tintOf("도쿄 여행"));
  });
});

describe("initialOf", () => {
  it("첫 글자를 뽑는다", () => {
    expect(initialOf("도쿄 여행")).toBe("도");
  });

  it("이모지를 쪼개지 않는다", () => {
    expect(initialOf("🗼 도쿄")).toBe("🗼");
  });

  it("빈 제목은 물음표", () => {
    expect(initialOf("")).toBe("?");
  });
});
