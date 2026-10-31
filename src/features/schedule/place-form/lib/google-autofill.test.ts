import { describe, expect, it } from "vitest";

import { dropPickedLink, fillFromPick, subtypeFromGoogle } from "./google-autofill";
import { blankPlaceForm } from "./place-form";

describe("fillFromPick", () => {
  const blank = blankPlaceForm(null);
  const shibuya = {
    name: "이치란 시부야점",
    category: "food" as const,
    subtype: "ramen" as const,
    gmap: "https://g/shibuya",
  };
  const shinjuku = {
    name: "이치란 신주쿠점",
    category: "food" as const,
    subtype: null,
    gmap: "https://g/shinjuku",
  };

  it("빈 칸은 고른 장소의 이름 · 카테고리 · 종류 · 구글맵 링크로 채운다", () => {
    expect(fillFromPick(blank, shibuya)).toEqual({
      name: "이치란 시부야점",
      category: "food",
      subtype: "ramen",
      gmap: "https://g/shibuya",
      auto: shibuya,
    });
  });

  it("A 를 고른 뒤 B 를 다시 고르면 B 의 값, 사용자가 고친 칸은 그대로", () => {
    const afterA = { ...blank, ...fillFromPick(blank, shibuya) };
    expect(fillFromPick(afterA, shinjuku)).toMatchObject({
      name: "이치란 신주쿠점",
      gmap: "https://g/shinjuku",
    });
    const edited = { ...afterA, name: "단골 라멘", category: "cafe" as const, gmap: "https://my" };
    expect(fillFromPick(edited, shinjuku)).toMatchObject({
      name: "단골 라멘",
      category: "cafe",
      gmap: "https://my",
    });
  });

  it("고른 장소의 종류를 모르면 앞서 채운 종류를 그대로 둔다 · 사용자가 고른 종류는 바꾸지 않는다", () => {
    const afterA = { ...blank, ...fillFromPick(blank, shibuya) };
    expect(fillFromPick(afterA, shinjuku).subtype).toBe("ramen");
    const chosen = { ...afterA, subtype: "sushi" as const };
    expect(fillFromPick(chosen, { ...shinjuku, subtype: "izakaya" }).subtype).toBe("sushi");
  });

  it("고른 장소의 카테고리를 모르면 카테고리는 그대로", () => {
    expect(
      fillFromPick({ ...blank, category: "sight" }, { ...shibuya, category: null }),
    ).toMatchObject({
      category: "sight",
    });
  });
});

describe("dropPickedLink", () => {
  it("자동으로 채운 링크만 지우고, 사용자가 적은 링크는 둔다", () => {
    const auto = { name: "", category: null, subtype: null, gmap: "https://g/a" };
    expect(dropPickedLink({ gmap: "https://g/a", auto })).toEqual({
      gmap: "",
      auto: { ...auto, gmap: "" },
    });
    expect(dropPickedLink({ gmap: "https://my", auto })).toEqual({ gmap: "https://my", auto });
  });
});

describe("subtypeFromGoogle", () => {
  it("대표 종류부터 처음 맞는 것, 모르면 null", () => {
    expect(subtypeFromGoogle(["ramen_restaurant", "restaurant"])).toBe("ramen");
    expect(subtypeFromGoogle(["restaurant", "food"])).toBeNull();
    expect(subtypeFromGoogle(["spa", "massage"])).toBe("onsen");
  });
});
