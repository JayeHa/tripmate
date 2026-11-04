import { describe, expect, it } from "vitest";

import { addTag, normalizeTag, sameTags, tripTags } from "./tags";

describe("normalizeTag", () => {
  it("앞의 # 과 앞뒤 공백을 떼고 20자로 자른다", () => {
    expect(normalizeTag("  #런닝 ")).toBe("런닝");
    expect(normalizeTag("##치이카와")).toBe("치이카와");
    expect(normalizeTag("가".repeat(25))).toBe("가".repeat(20));
    expect(normalizeTag("  # ")).toBe("");
  });

  it("자른 끝에 공백이 남지 않는다", () => {
    expect(normalizeTag(`${"가".repeat(19)} 나`)).toBe("가".repeat(19));
  });
});

describe("addTag", () => {
  it("다듬어서 뒤에 붙인다", () => {
    expect(addTag(["런닝"], " #치이카와")).toEqual(["런닝", "치이카와"]);
  });

  it("빈 값 · 이미 붙은 것(대소문자 무시) · 5개가 찬 목록은 그대로", () => {
    expect(addTag(["런닝"], "  ")).toEqual(["런닝"]);
    expect(addTag(["Asics"], "asics")).toEqual(["Asics"]);
    expect(addTag(["a", "b", "c", "d", "e"], "f")).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("tripTags", () => {
  it("많이 쓴 순, 같으면 가나다순. 칸이 없는 예전 줄은 건너뛴다", () => {
    const rows = [
      { tags: ["치이카와", "런닝"] },
      { tags: ["치이카와"] },
      { tags: [] },
      { tags: ["기념품"] },
      {} as { tags: string[] },
    ];
    expect(tripTags(rows)).toEqual(["치이카와", "기념품", "런닝"]);
  });
});

describe("sameTags", () => {
  it("순서까지 같아야 같다", () => {
    expect(sameTags(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameTags(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameTags([], [])).toBe(true);
  });
});
