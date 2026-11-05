import { describe, expect, it } from "vitest";

import { expenseFormSchema } from "../model/schema";
import { addTag, hasTag, normalizeTag, removeTag, sameTags, tagLength, tripTags } from "./tags";

describe("normalizeTag", () => {
  it("앞의 # 과 앞뒤 공백을 떼고 20자로 자른다", () => {
    expect(normalizeTag("  #런닝 ")).toBe("런닝");
    expect(normalizeTag("##치이카와")).toBe("치이카와");
    expect(normalizeTag("가".repeat(25))).toBe("가".repeat(20));
    expect(normalizeTag("  # ")).toBe("");
  });

  it("이모지를 반으로 자르지 않는다", () => {
    expect(normalizeTag(`${"가".repeat(19)}🏃🏃`)).toBe(`${"가".repeat(19)}🏃`);
    expect(normalizeTag("🏃".repeat(25))).toBe("🏃".repeat(20));
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

  it("여행에 대소문자만 다른 태그가 있으면 그 표기로 붙인다", () => {
    expect(addTag([], "asics", ["Asics", "런닝"])).toEqual(["Asics"]);
    expect(addTag([], "nike", ["Asics"])).toEqual(["nike"]);
  });
});

describe("hasTag · removeTag", () => {
  it("대소문자를 보지 않는다", () => {
    expect(hasTag(["asics"], "Asics")).toBe(true);
    expect(removeTag(["asics", "런닝"], "ASICS")).toEqual(["런닝"]);
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

  it("대소문자만 다른 태그는 하나로 세고 먼저 나온 표기를 쓴다", () => {
    expect(tripTags([{ tags: ["Asics"] }, { tags: ["asics"] }, { tags: ["런닝"] }])).toEqual([
      "Asics",
      "런닝",
    ]);
  });
});

describe("sameTags", () => {
  it("순서까지 같아야 같다", () => {
    expect(sameTags(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameTags(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameTags([], [])).toBe(true);
  });
});

describe("tagLength · 폼 검사", () => {
  it("이모지도 한 글자로 센다 — DB 의 char_length 와 같다", () => {
    expect(tagLength("🏃런닝")).toBe(3);
  });

  it("이모지 20개 태그는 폼 검사를 통과하고, 21개는 한국어 문구로 막는다", () => {
    const base = {
      name: "x",
      amount: 1,
      currency: "JPY",
      rate: null,
      payment_method: "card",
      payer: { kind: "member", id: "a" },
      split_each: false,
      participants: [{ kind: "member", id: "a" }],
      split_mode: "equal",
      category: "shopping",
      spent_on: null,
      counted: true,
      paid: true,
      due_date: null,
    };
    expect(expenseFormSchema.safeParse({ ...base, tags: ["🏃".repeat(20)] }).success).toBe(true);
    const bad = expenseFormSchema.safeParse({ ...base, tags: ["🏃".repeat(21)] });
    expect(bad.success ? "" : bad.error.issues[0]?.message).toBe("태그는 20자까지예요");
  });
});
