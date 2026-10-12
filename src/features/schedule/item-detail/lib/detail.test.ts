import { describe, expect, it } from "vitest";

import type { Place, ScheduleItem } from "@/entities/schedule-item";

import { placeInfoRows, planDraftOf, toPlanPatch } from "./detail";

const SUN = 0;
const MON = 1;

/** 기본값이 채워진 장소. 필요한 칸만 덮어쓴다 */
function place(patch: Partial<Place> = {}): Place {
  return {
    id: "p",
    city_id: "tokyo",
    created_by: "u",
    name: "히로키야",
    google_place_id: null,
    lat: 35.69,
    lng: 139.7,
    address: null,
    address_local: null,
    address_ko: null,
    address_detail: null,
    category: "food",
    emoji: null,
    rating: null,
    review_count: null,
    wait: null,
    description: null,
    hours: null,
    hours_week: null,
    gmap_url: null,
    links: [],
    created_at: "",
    updated_at: "",
    ...patch,
  };
}

/** 기본값이 채워진 일정 */
function item(patch: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: "i",
    trip_id: "t",
    day_index: 0,
    position: 0,
    kind: "place",
    place_id: "p",
    name: null,
    description: null,
    emoji: null,
    start_time: null,
    status: null,
    alternative_of: null,
    stay_id: null,
    flight_id: null,
    links: [],
    created_by: null,
    created_at: "",
    updated_at: "",
    place: place(),
    ...patch,
  };
}

describe("placeInfoRows", () => {
  it("설명 · 주소(상세 위치 포함) · 별점 · 운영시간 순, 빈 칸은 뺀다", () => {
    const rows = placeInfoRows(
      place({
        description: "야키니쿠",
        address: "Shinjuku, Tokyo",
        address_detail: "B1",
        address_local: "東京都新宿区",
        address_ko: "도쿄도 신주쿠구",
        rating: 4.8,
        review_count: 1355,
        hours: "17:00–23:00",
      }),
      MON,
    );
    expect(rows).toEqual([
      { label: "설명", value: "야키니쿠" },
      { label: "주소", value: "Shinjuku, Tokyo · B1\n東京都新宿区\n도쿄도 신주쿠구" },
      { label: "별점", value: "★ 4.8 (1,355)" },
      { label: "운영시간", value: "17:00–23:00", off: false, week: undefined },
    ]);
    expect(placeInfoRows(place(), MON)).toEqual([]);
  });

  it("요일별은 그날 값(휴무면 off)과 7일 요약", () => {
    const week = place({ hours_week: { mon: "17:00–23:00", sun: null } });
    expect(placeInfoRows(week, SUN)).toEqual([
      { label: "운영시간", value: "일요일 휴무", off: true, week: "월 17:00–23:00 · 일 휴무" },
    ]);
    expect(placeInfoRows(week, 3)[0]).toMatchObject({ value: "요일별로 달라요", off: undefined });
  });
});

describe("toPlanPatch", () => {
  it("place 는 상태 · 시간 · 일정 링크(빈 줄 버림)", () => {
    const it0 = item({
      status: "ok",
      start_time: "16:40:00",
      links: [{ title: "예약", url: "https://a" }],
    });
    const draft = planDraftOf(it0);
    expect(draft).toEqual({
      emoji: "",
      name: "",
      status: "ok",
      time: "16:40",
      links: [{ title: "예약", url: "https://a" }],
    });
    expect(
      toPlanPatch(
        it0,
        {
          ...draft,
          status: null,
          time: "",
          links: [...draft.links, { title: "", url: " " }],
        },
        draft,
      ),
    ).toEqual({
      // 링크는 빈 줄만 더해 실제로는 그대로 — 달라진 상태 · 시간만 보낸다
      ok: true,
      patch: { status: null, start_time: null },
    });
  });

  it("「수정」 을 연 뒤 바뀌지 않은 칸은 보내지 않는다(그사이 일행이 바꾼 링크를 덮지 않게)", () => {
    const it0 = item({ links: [{ title: "예약", url: "https://a" }] });
    const opened = planDraftOf(it0);
    expect(toPlanPatch(it0, { ...opened, time: "10:00" }, opened)).toEqual({
      ok: true,
      patch: { start_time: "10:00" },
    });
    expect(toPlanPatch(it0, opened, opened)).toEqual({ ok: true, patch: {} });
  });

  it("시간 칸이 틀린 채(친 그대로 「25:00」 · 「:30」) 넘어오면 거부한다", () => {
    const it0 = item({ start_time: "10:30:00" });
    const opened = planDraftOf(it0);
    expect(toPlanPatch(it0, { ...opened, time: "25:00" }, opened)).toEqual({
      ok: false,
      error: "시간을 확인해 주세요",
    });
    expect(toPlanPatch(it0, { ...opened, time: ":30" }, opened)).toEqual({
      ok: false,
      error: "시간을 확인해 주세요",
    });
  });

  it("아이콘은 앞뒤 공백을 떼고, 비우면 null", () => {
    const it0 = item({ emoji: "🍜" });
    const opened = planDraftOf(it0);
    expect(toPlanPatch(it0, { ...opened, emoji: " ♨️ " }, opened)).toEqual({
      ok: true,
      patch: { emoji: "♨️" },
    });
    expect(toPlanPatch(it0, { ...opened, emoji: "" }, opened)).toEqual({
      ok: true,
      patch: { emoji: null },
    });
  });

  it("링크 주소가 http(s) 가 아니면 오류", () => {
    const it0 = item();
    expect(
      toPlanPatch(
        it0,
        {
          ...planDraftOf(it0),
          links: [{ title: "x", url: "javascript:alert(1)" }],
        },
        planDraftOf(it0),
      ),
    ).toEqual({
      ok: false,
      error: "일정 링크 주소는 http:// 나 https:// 로 시작해야 해요",
    });
  });

  it("note 는 제목 · 시간만, 제목이 비면 오류", () => {
    const note = item({ kind: "note", place_id: null, place: null, name: "체크인" });
    expect(
      toPlanPatch(
        note,
        { ...planDraftOf(note), name: " 체크아웃 ", time: "11:00" },
        planDraftOf(note),
      ),
    ).toEqual({
      ok: true,
      patch: { name: "체크아웃", start_time: "11:00" },
    });
    expect(toPlanPatch(note, { ...planDraftOf(note), name: " " }, planDraftOf(note))).toMatchObject(
      {
        ok: false,
      },
    );
  });
});
