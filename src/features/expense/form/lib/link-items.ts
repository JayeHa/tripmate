import type { ExpenseCategory } from "@/entities/expense";
import {
  CATEGORY_LABEL,
  categoryOf,
  isMappedPlace,
  itemName,
  kindOf,
  type ScheduleItem,
} from "@/entities/schedule-item";

/** 일정 고르기의 종류 필터 — 값 · 이름 */
export const LINK_CATEGORIES = [
  ["all", "전체"],
  ["food", "식당"],
  ["sight", "관광"],
  ["shop", "쇼핑"],
  ["stay", "숙소"],
  ["flight", "항공"],
] as const;
export type LinkCategory = (typeof LINK_CATEGORIES)[number][0];

export type LinkFilter = {
  /** 0 부터의 날짜, 「전체 날짜」 면 "all" */
  day: number | "all";
  category: LinkCategory;
  /** 이름 검색. 있으면 날짜 필터는 보지 않는다(모든 날에서 찾는다) */
  query: string;
};

export type LinkRow = {
  id: string;
  /** 그날 지도 번호(좌표 있는 장소). 번호가 없는 일정은 null */
  n: number | null;
  name: string;
  /** 「day 2 · 음식점 · 12:30」 처럼 — 날짜는 전체 날짜 · 검색일 때만 */
  sub: string;
  dayIndex: number;
  alternative: boolean;
};

/** 일정 종류 이름 — 장소면 장소 카테고리, 항공편이면 「항공편」 */
function kindLabel(item: ScheduleItem): string | null {
  if (kindOf(item) === "flight") return "항공편";
  const category = categoryOf(item);
  return category ? CATEGORY_LABEL[category] : null;
}

/** 종류 필터에 맞는지 — 식당은 음식점 · 카페, 항공은 항공편 · 공항 */
function matchesCategory(item: ScheduleItem, filter: LinkCategory): boolean {
  if (filter === "all") return true;
  const kind = kindOf(item);
  const category = categoryOf(item);
  if (filter === "flight") return kind === "flight" || category === "air";
  if (filter === "food") return category === "food" || category === "cafe";
  return category === filter;
}

/** 일정 한 줄 → 목록 줄 */
function rowOf(
  item: ScheduleItem,
  n: number | null,
  alternative: boolean,
  withDay: boolean,
): LinkRow {
  const parts = [
    withDay ? `day ${item.day_index + 1}` : null,
    alternative ? "대체 장소" : null,
    kindLabel(item),
    item.start_time?.slice(0, 5) ?? null,
  ].filter((part) => part !== null);
  return {
    id: item.id,
    n,
    name: itemName(item),
    sub: parts.join(" · "),
    dayIndex: item.day_index,
    alternative,
  };
}

/**
 * 비용에 연결할 일정 목록 — 날짜 · 순서대로, 대체 장소는 붙은 일정 바로 아래. 메모(note)는 연결하지 않아 뺀다.
 * 번호는 타임라인 지도 번호와 같다(그날 좌표 있는 장소만 1, 2, …). 필터는 번호를 매긴 뒤에 건다 — 걸러도 번호가 바뀌지 않게
 */
export function linkRows(
  items: ScheduleItem[],
  alternatives: ScheduleItem[],
  filter: LinkFilter,
): LinkRow[] {
  const query = filter.query.trim();
  const withDay = filter.day === "all" || query !== "";
  const sorted = items
    .filter((item) => kindOf(item) !== "note")
    .toSorted((a, b) => a.day_index - b.day_index || a.position - b.position);
  const numbers = new Map<string, number>();
  const counts = new Map<number, number>();
  for (const item of sorted) {
    if (!isMappedPlace(item)) continue;
    const n = (counts.get(item.day_index) ?? 0) + 1;
    counts.set(item.day_index, n);
    numbers.set(item.id, n);
  }
  const rows = sorted.flatMap((item) => [
    { item, n: numbers.get(item.id) ?? null, alternative: false },
    ...alternatives
      .filter((alt) => alt.alternative_of === item.id)
      .map((alt) => ({ item: alt, n: null, alternative: true })),
  ]);
  return rows
    .filter(({ item }) => query !== "" || filter.day === "all" || item.day_index === filter.day)
    .filter(({ item }) => matchesCategory(item, filter.category))
    .filter(({ item }) => itemName(item).includes(query))
    .map(({ item, n, alternative }) => rowOf(item, n, alternative, withDay));
}

/** 일정에서 비용 카테고리 — 연결하면 이 값으로 채운다. 맞는 것이 없으면(휴식 · 카테고리 없음) null */
export function expenseCategoryOf(item: ScheduleItem): ExpenseCategory | null {
  if (kindOf(item) === "flight") return "flight";
  const map: Record<string, ExpenseCategory> = {
    food: "food",
    cafe: "food",
    sight: "activity",
    shop: "shopping",
    stay: "lodging",
    air: "transport",
  };
  const category = categoryOf(item);
  return category ? (map[category] ?? null) : null;
}
