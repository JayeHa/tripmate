import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "../model/types";
import { buildTimeline, placeNumbers } from "./timeline";

/** 기본값이 채워진 일정 한 줄. 필요한 칸만 덮어쓴다 */
function item(patch: Partial<ScheduleItem>): ScheduleItem {
  return {
    id: crypto.randomUUID(),
    trip_id: "t",
    day_index: 0,
    position: 0,
    name: "장소",
    place_id: null,
    lat: null,
    lng: null,
    address: null,
    start_time: null,
    memo: null,
    created_by: null,
    created_at: "",
    updated_at: "",
    kind: "place",
    status: null,
    category: null,
    emoji: null,
    rating: null,
    review_count: null,
    description: null,
    hours: null,
    gmap_url: null,
    links: [],
    alternatives: [],
    ...patch,
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
      item({ kind: "move", name: "이동" }),
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

  it("메모는 줄 단위 노트, 시각은 HH:mm", () => {
    const [row] = buildTimeline([item({ memo: "첫 줄\n\n  둘째 줄 ", start_time: "09:40:00" })]);
    expect(row.notes).toEqual(["첫 줄", "둘째 줄"]);
    expect(row.time).toBe("09:40");
  });
});
