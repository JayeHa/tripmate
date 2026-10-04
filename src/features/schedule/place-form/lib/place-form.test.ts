import { describe, expect, it } from "vitest";

import {
  blankPlaceForm,
  normalizeRating,
  normalizeReviews,
  type PlaceFormValues,
  samePoint,
  toNewPlace,
  withGooglePick,
  withoutGooglePick,
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

describe("samePoint", () => {
  it("1e-6° 안이면 같은 지점, 넘으면 다른 지점", () => {
    expect(samePoint({ lat: 35.7, lng: 139.7 }, { lat: 35.7000004, lng: 139.6999996 })).toBe(true);
    expect(samePoint({ lat: 35.7, lng: 139.7 }, { lat: 35.70001, lng: 139.7 })).toBe(false);
  });
});

describe("withGooglePick", () => {
  it("핀 · 구글 장소 id 를 옮기고 이름 · 카테고리 · 구글맵 링크를 채운다", () => {
    const next = withGooglePick(
      blankPlaceForm({ lat: 35.68, lng: 139.76 }),
      {
        name: "아후리",
        google_place_id: "ChIJ1",
        lat: 35.64,
        lng: 139.71,
        address: null,
        types: ["ramen_restaurant"],
      },
      { lat: 35.64, lng: 139.71 },
    );
    expect(next).toMatchObject({
      at: { lat: 35.64, lng: 139.71 },
      googleId: "ChIJ1",
      name: "아후리",
      category: "food",
      gmap: "https://www.google.com/maps/search/?api=1&query=%EC%95%84%ED%9B%84%EB%A6%AC&query_place_id=ChIJ1",
    });
  });
});

describe("withoutGooglePick", () => {
  it("구글 장소 id 와 자동으로 채운 링크를 지우고, 사용자가 적은 링크 · 이름 · 카테고리는 둔다", () => {
    const picked = withGooglePick(
      blankPlaceForm(null),
      { name: "아후리", google_place_id: "ChIJ1", lat: 1, lng: 2, address: null, types: ["cafe"] },
      { lat: 1, lng: 2 },
    );
    expect(withoutGooglePick(picked)).toMatchObject({
      googleId: null,
      gmap: "",
      name: "아후리",
      category: "cafe",
    });
    expect(withoutGooglePick({ ...picked, gmap: "https://my" })).toMatchObject({
      googleId: null,
      gmap: "https://my",
    });
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
