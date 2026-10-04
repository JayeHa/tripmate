import { describe, expect, it } from "vitest";

import {
  blankPlaceForm,
  nameAfterPick,
  normalizeRating,
  normalizeReviews,
  type PlaceFormValues,
  samePoint,
  toNewPlace,
} from "./place-form";

const form = (patch: Partial<PlaceFormValues>) => ({
  ...blankPlaceForm({ lat: 35.7, lng: 139.7 }),
  name: "유야 온천",
  ...patch,
});

/** 주소를 못 불러온 경우 */
const NO_ADDRESS = { address: null, addressLocal: null, addressKo: null };

describe("입력 정리", () => {
  it("별점은 숫자 · 점만 세 글자까지, 5 를 넘으면 5", () => {
    expect(normalizeRating("4.55")).toBe("4.5");
    expect(normalizeRating("★9")).toBe("5");
    expect(normalizeRating("")).toBe("");
  });

  it("리뷰 수는 숫자만, 천 단위 쉼표", () => {
    expect(normalizeReviews("1355")).toBe("1,355");
    expect(normalizeReviews("12a3")).toBe("123");
    expect(normalizeReviews("")).toBe("");
  });
});

describe("nameAfterPick", () => {
  const pick = (name: string, autoName: string, picked: string) =>
    nameAfterPick({ name, autoName }, picked).name;

  it("비었거나 검색어 그대로면 고른 장소 이름, 고쳐 쓴 이름은 둔다", () => {
    expect(pick("이치", "이치", "이치란 시부야")).toBe("이치란 시부야");
    expect(pick(" ", "이치", "이치란 시부야")).toBe("이치란 시부야");
    expect(pick("단골 라멘집", "이치", "이치란 시부야")).toBe("단골 라멘집");
  });

  it("A 를 고른 뒤 B 를 다시 고르면 B 의 이름, A 이름을 고쳐 썼으면 그대로", () => {
    const afterA = nameAfterPick({ name: "이치", autoName: "이치" }, "이치란 시부야");
    expect(nameAfterPick(afterA, "이치란 신주쿠").name).toBe("이치란 신주쿠");
    expect(nameAfterPick({ ...afterA, name: "이치란(본점)" }, "이치란 신주쿠").name).toBe(
      "이치란(본점)",
    );
  });
});

describe("samePoint", () => {
  it("1e-6° 안이면 같은 지점, 넘으면 다른 지점", () => {
    expect(samePoint({ lat: 35.7, lng: 139.7 }, { lat: 35.7000004, lng: 139.6999996 })).toBe(true);
    expect(samePoint({ lat: 35.7, lng: 139.7 }, { lat: 35.70001, lng: 139.7 })).toBe(false);
  });
});

describe("toNewPlace", () => {
  it("장소 칸으로 바꾸고 빈 칸은 null, 빈 링크 줄은 버린다", () => {
    const r = toNewPlace(
      form({
        name: "  유야 온천 ",
        emoji: "♨️",
        category: "rest",
        rating: "4.3",
        reviews: "1,355",
        wait: "20분",
        links: [
          { title: "예약", url: " https://example.com " },
          { title: "", url: "" },
        ],
        googleId: "g1",
        addressDetail: " 3층 ",
      }),
      { address: "Shibuya, Tokyo", addressLocal: "東京都渋谷区", addressKo: "도쿄도 시부야구" },
    );
    expect(r).toEqual({
      ok: true,
      value: {
        name: "유야 온천",
        emoji: "♨️",
        category: "rest",
        lat: 35.7,
        lng: 139.7,
        address: "Shibuya, Tokyo",
        address_local: "東京都渋谷区",
        address_ko: "도쿄도 시부야구",
        address_detail: "3층",
        google_place_id: "g1",
        hours: null,
        rating: 4.3,
        review_count: 1355,
        wait: "20분",
        description: null,
        gmap_url: null,
        links: [{ title: "예약", url: "https://example.com" }],
      },
    });
  });

  it("이름 · 카테고리는 비어 시작하고, 카테고리를 고르지 않으면 null 로 보낸다(기존 장소의 값을 덮지 않게)", () => {
    const blank = blankPlaceForm({ lat: 35.7, lng: 139.7 });
    expect(blank.name).toBe("");
    expect(blank.category).toBeNull();
    expect(toNewPlace(form({}), NO_ADDRESS)).toMatchObject({ ok: true, value: { category: null } });
  });

  it("위치 · 이름이 없거나 링크 주소가 http(s) 가 아니면 사용자가 고칠 수 있는 문구를 돌려준다", () => {
    expect(toNewPlace(form({ at: null }), NO_ADDRESS)).toEqual({
      ok: false,
      error: "위치를 정해 주세요",
    });
    expect(toNewPlace(form({ name: " " }), NO_ADDRESS)).toEqual({
      ok: false,
      error: "장소 이름을 입력해 주세요",
    });
    expect(toNewPlace(form({ gmap: "maps.app.goo.gl/x" }), NO_ADDRESS)).toMatchObject({
      ok: false,
    });
    expect(
      toNewPlace(form({ links: [{ title: "공식", url: "javascript:alert(1)" }] }), NO_ADDRESS),
    ).toEqual({
      ok: false,
      error: "장소 링크 주소는 http:// 나 https:// 로 시작해야 해요",
    });
  });
});
