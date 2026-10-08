import type { ExpenseCategory } from "@/entities/expense";
import {
  CATEGORY_LABEL,
  categoryOf,
  itemName,
  kindOf,
  type LinkPickCategory,
  type LinkPickGroup,
  type LinkPickItem,
  type PlaceCategory,
  type ScheduleItem,
} from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";

/** 일정 연결 창의 카테고리 필터 — 관광 · 식비 · 쇼핑 · 카페 · 숙소 · 항공. 휴식은 필터가 없다 */
const LINK_CATEGORY: Partial<Record<PlaceCategory | "flight", LinkPickCategory>> = {
  sight: { value: "sight", label: "관광" },
  food: { value: "food", label: "식비" },
  shop: { value: "shop", label: "쇼핑" },
  cafe: { value: "cafe", label: "카페" },
  stay: { value: "stay", label: "숙소" },
  flight: { value: "flight", label: "항공" },
  air: { value: "flight", label: "항공" },
};

/** 일정 연결 줄 — 썸네일은 화면이 thumbCategory 로 그린다 */
export type LinkItem = LinkPickItem & { thumbCategory: PlaceCategory | null };
export type LinkGroup = Omit<LinkPickGroup, "items"> & { items: LinkItem[] };

/** 일정 종류 이름 — 장소면 장소 카테고리, 항공편이면 「항공편」 */
function kindLabel(item: ScheduleItem): string | null {
  if (kindOf(item) === "flight") return "항공편";
  const category = categoryOf(item);
  return category ? CATEGORY_LABEL[category] : null;
}

/** 일정 한 줄 → 연결 창의 줄. 둘째 줄 = 「대체 장소 · 음식점 · 12:30」 */
function linkItemOf(item: ScheduleItem, alternative: boolean): LinkItem {
  const flight = kindOf(item) === "flight";
  const category = categoryOf(item);
  return {
    id: item.id,
    title: itemName(item),
    meta: [alternative ? "대체 장소" : null, kindLabel(item), item.start_time?.slice(0, 5) ?? null]
      .filter((part) => part !== null)
      .join(" · "),
    category: LINK_CATEGORY[flight ? "flight" : (category ?? "rest")] ?? null,
    thumbCategory: flight ? "air" : category,
  };
}

/**
 * 비용에 연결할 일정을 날짜 묶음으로 — 날마다 순서대로, 대체 장소는 붙은 일정 바로 아래. 메모(note)는 연결하지 않아 뺀다.
 * 일정이 없는 날은 묶음을 만들지 않는다. 묶음 key 는 0 부터의 날 순번(글자)
 */
export function linkGroups(
  startDate: string,
  items: ScheduleItem[],
  alternatives: ScheduleItem[],
): LinkGroup[] {
  const sorted = items
    .filter((item) => kindOf(item) !== "note")
    .toSorted((a, b) => a.day_index - b.day_index || a.position - b.position);
  const groups = new Map<number, LinkGroup>();
  for (const item of sorted) {
    const day = item.day_index;
    const group = groups.get(day) ?? {
      key: String(day),
      short: `day ${day + 1}`,
      date: dayLabel(startDate, day),
      items: [],
    };
    group.items.push(
      linkItemOf(item, false),
      ...alternatives
        .filter((alt) => alt.alternative_of === item.id)
        .map((alt) => linkItemOf(alt, true)),
    );
    groups.set(day, group);
  }
  return [...groups.values()];
}

/**
 * 일정에서 비용 카테고리 — 연결하면 이 값으로 채운다. 맞는 것이 없으면(카테고리 없음) null.
 * 휴식(온천 · 스파 · 정원 입장 등)은 입장료 · 체험 성격이라 관광으로 본다(2026-10-09 사용자 결정)
 */
export function expenseCategoryOf(item: ScheduleItem): ExpenseCategory | null {
  if (kindOf(item) === "flight") return "flight";
  const map: Record<string, ExpenseCategory> = {
    food: "food",
    cafe: "food",
    sight: "activity",
    rest: "activity",
    shop: "shopping",
    stay: "lodging",
    air: "transport",
  };
  const category = categoryOf(item);
  return category ? (map[category] ?? null) : null;
}
