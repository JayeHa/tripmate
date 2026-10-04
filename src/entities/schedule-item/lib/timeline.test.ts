import { describe, expect, it } from "vitest";

import type { Move } from "../model/move";
import type { Place, ScheduleItem } from "../model/types";
import { buildTimeline, placeNumbers } from "./timeline";

type PlaceFields = Pick<
  Place,
  "lat" | "lng" | "category" | "rating" | "review_count" | "hours" | "gmap_url" | "links"
>;
type ItemPatch = Partial<Omit<ScheduleItem, "place">> & Partial<PlaceFields>;

/**
 * 기본값이 채워진 일정 한 줄. 필요한 칸만 덮어쓴다.
 * place 면 장소 칸(좌표 · 카테고리 · 별점 …)과 name · description 을 장소로 옮겨 붙인다 — 화면이 받는 모양 그대로.
 */
function item(patch: ItemPatch): ScheduleItem {
  const {
    lat = null,
    lng = null,
    category = null,
    rating = null,
    review_count = null,
    hours = null,
    gmap_url = null,
    links = [],
    ...fields
  } = patch;
  const row = {
    id: crypto.randomUUID(),
    trip_id: "t",
    day_index: 0,
    position: 0,
    kind: "place",
    place_id: null,
    name: "장소",
    description: null,
    emoji: null,
    start_time: null,
    status: null,
    memo: null,
    alternatives: [],
    links: [],
    created_by: null,
    created_at: "",
    updated_at: "",
    ...fields,
  };
  if (row.kind !== "place") return { ...row, place: null };
  const placeId = `p-${row.id}`;
  return {
    ...row,
    name: null,
    description: null,
    place_id: placeId,
    place: {
      id: placeId,
      city_id: "tokyo",
      created_by: "u",
      name: row.name ?? "장소",
      description: row.description,
      emoji: null,
      google_place_id: null,
      address: null,
      address_local: null,
      address_ko: null,
      address_detail: null,
      lat,
      lng,
      category,
      rating,
      review_count,
      wait: null,
      hours,
      hours_week: null,
      gmap_url,
      links,
      created_at: "",
      updated_at: "",
    },
  };
}

const TOKYO_STATION = { lat: 35.6812, lng: 139.7671 };
const SKYTREE = { lat: 35.7101, lng: 139.8107 };

describe("placeNumbers", () => {
  it("note · flight · move · 좌표 없는 place 는 건너뛴다 (지도 핀과 같은 번호)", () => {
    const items = [
      item({ kind: "note", id: "n" }),
      item({ kind: "flight", id: "f", ...TOKYO_STATION }),
      item({ id: "a", ...TOKYO_STATION }),
      item({ id: "x" }),
      item({ id: "b", ...SKYTREE }),
    ];
    expect([...placeNumbers(items)]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });
});

describe("buildTimeline", () => {
  it("번호는 좌표 있는 place 에만, 길찾기는 직전 번호 장소에서", () => {
    const rows = buildTimeline([
      item({ ...TOKYO_STATION }),
      item({ kind: "note", name: "메모" }),
      item({ name: "좌표 없음" }),
      item({ ...SKYTREE }),
      item({ lat: SKYTREE.lat + 0.0001, lng: SKYTREE.lng }),
    ]);
    expect(rows.map((r) => r.num)).toEqual([1, null, null, 2, 3]);
    expect(rows[3].leg?.label).toBe("5.1km · 약 20분");
    expect(rows[3].leg?.url).toContain("origin=35.6812%2C139.7671");
    // 11m 떨어진 곳은 같은 장소로 본다
    expect(rows[4].leg).toBeNull();
  });

  it("이동 방법은 직전 번호 장소 → 이 장소 쌍에 붙고, 순서가 바뀌어 이웃하지 않으면 보이지 않는다", () => {
    const a = item({ id: "a", name: "도쿄역", ...TOKYO_STATION });
    const b = item({ id: "b", name: "스카이트리", ...SKYTREE });
    const move = (patch: Partial<Move>): Move => ({
      id: "m",
      trip_id: "t",
      from_item_id: "a",
      to_item_id: "b",
      mode: null,
      detail: null,
      created_at: "",
      updated_at: "",
      ...patch,
    });

    const [, withMode] = buildTimeline([a, b], [move({ mode: "subway", detail: "긴자선" })]);
    expect(withMode.leg).toMatchObject({
      fromItemId: "a",
      fromName: "도쿄역",
      mode: "subway",
      modeLabel: "🚇 지하철",
      detail: "긴자선",
      hasMove: true,
    });

    const [, detailOnly] = buildTimeline([a, b], [move({ detail: "걸어서" })]);
    expect(detailOnly.leg).toMatchObject({ modeLabel: null, detail: "걸어서", hasMove: true });

    const [, swapped] = buildTimeline([b, a], [move({ mode: "subway" })]);
    expect(swapped.leg).toMatchObject({ fromItemId: "b", hasMove: false, modeLabel: null });
  });

  it("메타 줄은 카테고리 · 별점(리뷰) · 설명", () => {
    const [row] = buildTimeline([
      item({ category: "food", rating: 4.2, review_count: 1355, description: "에도마에 텐동" }),
    ]);
    expect(row.meta).toBe("음식점 · ★ 4.2 (1,355) · 에도마에 텐동");
    expect(row.isMeal).toBe(true);
    expect(row.emoji).toBe("🍜");
  });

  it("이모지는 사용자 입력이 먼저, 빈 문자열이면 숨긴다. place 가 아니면 기본값이 없다", () => {
    const rows = buildTimeline([
      item({ category: "food", emoji: "🍣" }),
      item({ category: "food", emoji: "" }),
      item({}),
      item({ kind: "note" }),
    ]);
    expect(rows.map((r) => r.emoji)).toEqual(["🍣", null, "📍", null]);
  });

  it("잘못된 값은 버린다: 모르는 상태·카테고리, 모양이 틀린 링크·대체 장소", () => {
    const [row] = buildTimeline([
      item({
        status: "done",
        category: "bar",
        gmap_url: "https://maps.google.com/x",
        links: [
          { title: "", url: "https://a" },
          { url: 1 },
          "x",
          { title: "스크립트", url: "javascript:alert(1)" },
        ],
        alternatives: [
          { name: "B", gmap: "https://b" },
          { name: "C" },
          { name: "D", gmap: "data:text/html,x" },
        ],
      }),
    ]);
    expect(row.status).toBeNull();
    expect(row.category).toBeNull();
    expect(row.links).toEqual([
      { title: "구글맵", url: "https://maps.google.com/x", gmap: true },
      { title: "링크", url: "https://a", gmap: false },
    ]);
    expect(row.alternatives).toEqual([{ name: "B", gmap: "https://b" }]);
  });

  it("링크 칩은 구글맵 · 일정 링크 · 장소 링크 순서", () => {
    const base = item({
      gmap_url: "https://maps.google.com/x",
      links: [{ title: "공식", url: "https://place.example" }],
    });
    const [row] = buildTimeline([
      { ...base, links: [{ title: "티켓", url: "https://t.example" }] },
    ]);
    expect(row.links.map((l) => l.title)).toEqual(["구글맵", "티켓", "공식"]);
  });

  it("요일별 운영시간은 그날 요일 값만, 휴무면 hoursOff", () => {
    const base = item({ hours: "10:00–20:00" });
    const week = {
      ...base,
      place: { ...base.place!, hours_week: { mon: "11:00–22:00", sun: null } },
    };
    expect(buildTimeline([week], [], 1)[0]).toMatchObject({
      hours: "월 11:00–22:00",
      hoursOff: false,
    });
    expect(buildTimeline([week], [], 0)[0]).toMatchObject({ hours: "일요일 휴무", hoursOff: true });
    expect(buildTimeline([base], [], 0)[0]).toMatchObject({
      hours: "10:00–20:00",
      hoursOff: false,
    });
  });

  it("메모는 줄 단위 노트, 시각은 HH:mm", () => {
    const [row] = buildTimeline([item({ memo: "첫 줄\n\n  둘째 줄 ", start_time: "09:40:00" })]);
    expect(row.notes).toEqual(["첫 줄", "둘째 줄"]);
    expect(row.time).toBe("09:40");
  });
});
