import { describe, expect, it } from "vitest";

import type { Place } from "@/entities/schedule-item";

import { googleMapsUrl } from "./google-autofill";
import { placeEditErrorMessage, placeFormOf, storedAddressOf, toPlacePatch } from "./place-edit";
import { withoutGooglePick } from "./place-form";

/** 기본값이 채워진 장소. 필요한 칸만 덮어쓴다 */
function place(patch: Partial<Place> = {}): Place {
  return {
    id: "p",
    city_id: "tokyo",
    created_by: "u",
    name: "히로키야",
    google_place_id: "g1",
    lat: 35.69,
    lng: 139.7,
    address: "Shinjuku, Tokyo",
    address_local: "東京都新宿区",
    address_ko: "도쿄도 신주쿠구",
    address_detail: "B1",
    category: "food",
    emoji: "🍖",
    rating: 4.8,
    review_count: 1355,
    wait: "40분",
    description: "야키니쿠",
    hours: "17:00–23:00",
    hours_week: {},
    gmap_url: "https://maps.app.goo.gl/x",
    links: [{ title: "메뉴", url: "https://menu" }],
    created_at: "",
    updated_at: "",
    ...patch,
  };
}

describe("placeFormOf", () => {
  it("저장된 칸으로 폼을 채운다 — 리뷰 수는 쉼표, 아이콘은 일정 칸이라 비운다", () => {
    expect(placeFormOf(place())).toMatchObject({
      emoji: "",
      name: "히로키야",
      category: "food",
      at: { lat: 35.69, lng: 139.7 },
      googleId: "g1",
      addressDetail: "B1",
      hoursMode: "same",
      hours: "17:00–23:00",
      rating: "4.8",
      reviews: "1,355",
      wait: "40분",
      description: "야키니쿠",
      gmap: "https://maps.app.goo.gl/x",
      links: [{ title: "메뉴", url: "https://menu" }],
    });
  });

  it("요일별이 있으면 요일별 — 휴무는 null, 모르는 요일은 빈칸. 모르는 카테고리 · 위치 없음은 null", () => {
    const v = placeFormOf(
      place({ hours_week: { mon: "11:00–22:00", sun: null }, category: "bar", lat: null }),
    );
    expect(v.hoursMode).toBe("week");
    expect(v.hoursWeek).toEqual({
      mon: "11:00–22:00",
      tue: "",
      wed: "",
      thu: "",
      fri: "",
      sat: "",
      sun: null,
    });
    expect(v.category).toBeNull();
    expect(v.at).toBeNull();
  });
});

describe("placeFormOf — 구글맵 링크", () => {
  it("그 장소 구글 id 로 만든 링크면 자동 채움으로 — 위치를 옮기면(연결 해제) 함께 지워진다", () => {
    const url = googleMapsUrl("옛 이름", "g1");
    const v = placeFormOf(place({ gmap_url: url }));
    expect(v.auto.gmap).toBe(url);
    expect(withoutGooglePick(v)).toMatchObject({ gmap: "", googleId: null });
  });

  it("사용자가 적은 링크 · 다른 장소 id 링크는 그대로 둔다", () => {
    expect(placeFormOf(place()).auto.gmap).toBe("");
    const other = placeFormOf(place({ gmap_url: googleMapsUrl("x", "g2") }));
    expect(withoutGooglePick(other).gmap).toBe(googleMapsUrl("x", "g2"));
  });
});

describe("toPlacePatch", () => {
  const p = place();
  const opened = placeFormOf(p);
  const stored = storedAddressOf(p);

  it("손대지 않으면 빈 patch, 고친 칸만 보낸다", () => {
    expect(toPlacePatch(opened, stored, opened, stored)).toEqual({ ok: true, patch: {} });
    expect(
      toPlacePatch({ ...opened, name: " 히로키야 본점 ", wait: "" }, stored, opened, stored),
    ).toEqual({ ok: true, patch: { name: "히로키야 본점", wait: null } });
  });

  it("위치를 옮기면 좌표 · 새 주소 · 구글 장소 연결 해제가 함께 간다", () => {
    const moved = { ...opened, at: { lat: 35.7, lng: 139.71 }, googleId: null };
    const found = { address: "Nishi-Shinjuku", addressLocal: "西新宿", addressKo: "니시신주쿠" };
    expect(toPlacePatch(moved, found, opened, stored)).toEqual({
      ok: true,
      patch: {
        lat: 35.7,
        lng: 139.71,
        address: "Nishi-Shinjuku",
        address_local: "西新宿",
        address_ko: "니시신주쿠",
        google_place_id: null,
      },
    });
  });

  it("위치 없이 만들어진 장소는 위치를 정하지 않아도 이름을 고칠 수 있다", () => {
    const old = place({
      lat: null,
      lng: null,
      address: null,
      address_local: null,
      address_ko: null,
    });
    const v = placeFormOf(old);
    expect(
      toPlacePatch({ ...v, name: "히로키야 2호점" }, storedAddressOf(old), v, storedAddressOf(old)),
    ).toEqual({ ok: true, patch: { name: "히로키야 2호점" } });
    // 위치가 있던 장소는 그대로 필수
    expect(toPlacePatch({ ...opened, at: null }, stored, opened, stored)).toMatchObject({
      ok: false,
    });
  });

  it("운영시간을 비우면 둘 다 지운다, 이름이 비면 오류", () => {
    expect(toPlacePatch({ ...opened, hours: "" }, stored, opened, stored)).toEqual({
      ok: true,
      patch: { hours: null, hours_week: null },
    });
    expect(toPlacePatch({ ...opened, name: " " }, stored, opened, stored)).toEqual({
      ok: false,
      error: "장소 이름을 입력해 주세요",
    });
  });
});

describe("placeEditErrorMessage", () => {
  it("같은 구글 장소 중복 · 남의 장소는 이유를, 그 밖은 다시 시도", () => {
    expect(
      placeEditErrorMessage({ message: 'duplicate key value violates "places_owner_google_key"' }),
    ).toMatch(/이미 다른 장소로/);
    expect(placeEditErrorMessage(new Error("이 장소는 만든 사람만 고칠 수 있어요"))).toBe(
      "이 장소는 만든 사람만 고칠 수 있어요",
    );
    expect(placeEditErrorMessage(new TypeError("Failed to fetch"))).toMatch(/다시 시도/);
  });
});
