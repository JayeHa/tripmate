import { describe, expect, it } from "vitest";

import type {
  RouteSegment,
  RouteStopData,
  ScheduleItem,
  VisitPhoto,
} from "@/entities/schedule-item";

import {
  type DayInput,
  travelogueDays,
  type TravelogueRecords,
  travelogueTotals,
} from "./travelogue";

/** 테스트용 역 — 장소(같은 이름이면 같은 장소) · 다음 역까지 도보 분(없으면 구간 없음) */
function stop(id: string, opts: { walk?: number; kind?: "place" | "flight"; place?: string } = {}) {
  const item = {
    id,
    name: id,
    kind: opts.kind ?? "place",
    place: { google_place_id: opts.place ?? id, name: id },
  } as unknown as ScheduleItem;
  const seg =
    opts.walk === undefined
      ? null
      : ({
          mode: "walk",
          icon: "🚶",
          minutes: opts.walk,
          estimated: false,
          modeName: "도보",
        } as RouteSegment);
  return {
    row: { item, kind: opts.kind ?? "place", time: "10:00", emoji: null, category: "food" },
    seg,
  } as unknown as RouteStopData;
}

/** 테스트용 사진 · 영상 */
function media(id: string, video = false): VisitPhoto {
  return {
    id,
    video_key: video ? `${id}.mp4` : null,
    duration: video ? 5 : null,
    poster_at: video ? 1 : null,
  } as VisitPhoto;
}

/** 하루 입력 */
function day(n: number, stops: RouteStopData[], extra: Partial<DayInput> = {}): DayInput {
  return { day: n, stops, summary: null, open: true, today: false, ...extra };
}

const me = { id: "me", name: "정원", avatarUrl: null };
const kim = { id: "kim", name: "김동규", avatarUrl: null };

/** 기록 기본값 */
function records(extra: Partial<TravelogueRecords> = {}): TravelogueRecords {
  return { marks: {}, notes: {}, photos: {}, ratings: {}, members: [me, kim], me: "me", ...extra };
}

describe("travelogueDays", () => {
  it("다녀온 곳은 블록, 패스는 한 줄, 표시 없는 곳 · 항공편은 없다. 이동은 바로 이어진 두 곳 사이에만", () => {
    const stops = [
      stop("a", { walk: 11 }),
      stop("b", { walk: 5 }),
      stop("c", { walk: 3 }),
      stop("d"),
      stop("f", { kind: "flight" }),
    ];
    const [d] = travelogueDays(
      [day(0, stops)],
      records({ marks: { a: "visited", b: "skipped", d: "visited", f: "visited" } }),
    );
    expect(d.entries.map((e) => (e.type === "move" ? e.label : `${e.type}:${e.id}`))).toEqual([
      "place:a",
      "🚶 도보 11분",
      "pass:b",
      "place:d",
    ]);
    expect(d.places).toBe(2);
  });

  it("기록 없이 다녀온 곳은 한 줄(plain), 글 · 사진 · 별점이 있으면 블록 — 숫자 · 베스트 · 첫 줄 · 콜라주", () => {
    const stops = [stop("a"), stop("b"), stop("c")];
    const [d] = travelogueDays(
      [day(0, stops, { summary: "  러닝 & 신주쿠 " })],
      records({
        marks: { a: "visited", b: "visited", c: "visited" },
        notes: {
          a: { body: "줄 40분\n붕어 텐동" },
          b: { body: "  " },
          c: { body: "야경" },
        } as unknown as TravelogueRecords["notes"],
        photos: { a: [media("p1"), media("v1", true)], c: [media("p2")] },
        ratings: { a: { me: 5, kim: 4 }, c: { kim: 5 } },
      }),
    );
    const [a, b] = d.entries;
    expect(a.type === "place" && a.plain).toBe(false);
    expect(b.type === "place" && b.plain).toBe(true);
    expect(a.type === "place" && a.rating).toEqual({
      average: 4.5,
      people: [
        expect.objectContaining({ id: "me", stars: 5 }),
        expect.objectContaining({ id: "kim", stars: 4 }),
      ],
    });
    expect(d).toMatchObject({
      title: "러닝 & 신주쿠",
      places: 3,
      photos: 2,
      videos: 1,
      notes: 2,
      average: 4.8,
      best: { name: "c", average: 5 },
      lines: [
        { id: "a", text: "줄 40분" },
        { id: "c", text: "야경" },
      ],
    });
    expect(d.collage.map((p) => p.id)).toEqual(["p1", "v1", "p2"]);
  });

  it("같은 장소가 다시 나오면 별점 줄이 없다(다른 날이어도)", () => {
    const ratings = { a1: { me: 4 }, a2: { me: 4 } };
    const days = travelogueDays(
      [day(0, [stop("a1", { place: "A" })]), day(1, [stop("a2", { place: "A" })])],
      records({ marks: { a1: "visited", a2: "visited" }, ratings }),
    );
    const first = days[0].entries[0];
    const again = days[1].entries[0];
    expect(first.type === "place" && first.rating?.average).toBe(4);
    expect(again.type === "place" && again.rating).toBeNull();
  });

  it("닫힌 날은 줄이 없고, 여행 중 오늘이면 표시 없는 첫 장소를 「지금」 으로", () => {
    const days = travelogueDays(
      [
        day(0, [stop("a"), stop("b"), stop("c")], { today: true }),
        day(1, [stop("d")], { open: false }),
      ],
      records({ marks: { a: "visited", d: "visited" } }),
    );
    expect(days[0].here).toBe("b");
    expect(days[1]).toMatchObject({ open: false, entries: [], places: 0, here: null, title: null });
  });
});

describe("travelogueTotals", () => {
  it("다녀온 곳 · 사진과 영상 · 글 · 평균 별점(장소 평균의 평균)", () => {
    const days = travelogueDays(
      [day(0, [stop("a"), stop("b")]), day(1, [stop("c")])],
      records({
        marks: { a: "visited", b: "visited", c: "visited" },
        photos: { a: [media("p1"), media("v1", true)] },
        notes: { c: { body: "좋았다" } } as unknown as TravelogueRecords["notes"],
        ratings: { a: { me: 5, kim: 4 }, c: { me: 3 } },
      }),
    );
    expect(travelogueTotals(days)).toEqual({ places: 3, media: 2, notes: 1, average: 3.8 });
  });
});
