import { describe, expect, it } from "vitest";

import {
  blankPlaceForm,
  normalizeRating,
  normalizeReviews,
  type PlaceFormValues,
  samePoint,
  toPlaceSchedule,
} from "./place-form";

const form = (patch: Partial<PlaceFormValues>) => ({
  ...blankPlaceForm("유야 온천"),
  at: { lat: 35.7, lng: 139.7 },
  ...patch,
});

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

describe("toPlaceSchedule", () => {
  it("장소 정보 · 이번 일정 칸으로 나누고 빈 칸은 null, 빈 링크 줄은 버린다", () => {
    const r = toPlaceSchedule(
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
        status: "wait",
        time: "19:30",
        memo: " 수건 ",
        google: { id: "g1", address: "도쿄도 …" },
      }),
    );
    expect(r).toEqual({
      ok: true,
      value: {
        place: {
          name: "유야 온천",
          emoji: "♨️",
          category: "rest",
          lat: 35.7,
          lng: 139.7,
          address: "도쿄도 …",
          google_place_id: "g1",
          hours: null,
          rating: 4.3,
          review_count: 1355,
          wait: "20분",
          description: null,
          gmap_url: null,
          links: [{ title: "예약", url: "https://example.com" }],
        },
        item: { status: "wait", start_time: "19:30", memo: "수건", links: [] },
      },
    });
  });

  it("이름이 없거나 링크 주소가 http(s) 가 아니면 사용자가 고칠 수 있는 문구를 돌려준다", () => {
    expect(toPlaceSchedule(form({ name: " " }))).toEqual({
      ok: false,
      error: "장소 이름을 입력해 주세요",
    });
    expect(toPlaceSchedule(form({ gmap: "maps.app.goo.gl/x" }))).toMatchObject({ ok: false });
    expect(
      toPlaceSchedule(form({ planLinks: [{ title: "티켓", url: "javascript:alert(1)" }] })),
    ).toEqual({
      ok: false,
      error: "일정 링크 주소는 http:// 나 https:// 로 시작해야 해요",
    });
  });
});
