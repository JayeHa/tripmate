import { type ChecklistTargetRef, targetKey } from "@/entities/checklist";
import type { Flight } from "@/entities/flight";
import {
  CATEGORY_LABEL,
  categoryOf,
  itemName,
  kindOf,
  type LinkPickGroup,
  type LinkPickItem,
  type PlaceCategory,
  type ScheduleItem,
} from "@/entities/schedule-item";
import type { Stay } from "@/entities/stay";
import { dayLabel, dayParts } from "@/shared/lib/days";

/** 연결 고르기 · 이름에 쓰는 여행의 것들 */
export type TargetSources = {
  startDate: string;
  /** 타임라인 일정(대체 장소 제외) */
  items: ScheduleItem[];
  flights: Flight[];
  stays: Stay[];
};

/** 고르기 창의 줄 — 썸네일은 화면이 thumbCategory 로 그린다. id 는 targetKey */
export type TargetOption = LinkPickItem & { thumbCategory: PlaceCategory | null };
export type TargetGroup = Omit<LinkPickGroup, "items"> & { items: TargetOption[] };

/** 「2027-10-31」 → 「10/31」 */
function slashDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/** 「7C1181」 */
function flightCode(f: Flight): string {
  return `${f.airline_code}${f.flight_no}`;
}

/** 「10.31」 — 연도 없이 */
function dotDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}.${Number(d)}`;
}

/** 일정 카드 한 줄 → 고르기 줄. 항공편 카드는 그 항공편을 고르는 줄이 된다. 연결할 수 없으면(메모 · 항공편 없음) null */
function optionOf(item: ScheduleItem, flights: Map<string, Flight>): TargetOption | null {
  const kind = kindOf(item);
  if (kind === "note") return null;
  if (kind === "flight") {
    const flight = item.flight_id ? flights.get(item.flight_id) : undefined;
    if (!flight) return null;
    return {
      id: targetKey({ kind: "flight", id: flight.id }),
      title: `항공 · ${flightCode(flight)}`,
      meta: `항공편 · ${itemName(item)}`,
      category: { value: "flight", label: "항공편" },
      thumbCategory: "air",
    };
  }
  const category = categoryOf(item);
  return {
    id: targetKey({ kind: "schedule_item", id: item.id }),
    title: itemName(item),
    meta: [category ? CATEGORY_LABEL[category] : null, item.start_time?.slice(0, 5) ?? null]
      .filter((part) => part !== null)
      .join(" · "),
    category: category ? { value: category, label: CATEGORY_LABEL[category] } : null,
    thumbCategory: category,
  };
}

/**
 * 연결 고르기 창의 묶음 — 날마다 일정 카드(순서대로, 항공편 카드는 그 항공편), 맨 끝에 「숙소」 묶음.
 * 이미 고른 대상(picked, targetKey)은 빼고, 줄이 없는 묶음은 만들지 않는다. 날 묶음 key 는 0 부터의 날 순번(글자)
 */
export function targetGroups(src: TargetSources, picked: Set<string>): TargetGroup[] {
  const flights = new Map(src.flights.map((f) => [f.id, f]));
  const days = new Map<number, TargetGroup>();
  const sorted = src.items.toSorted((a, b) => a.day_index - b.day_index || a.position - b.position);
  for (const item of sorted) {
    const option = optionOf(item, flights);
    if (!option || picked.has(option.id)) continue;
    const day = item.day_index;
    const group = days.get(day) ?? {
      key: String(day),
      short: `day ${day + 1}`,
      date: dayLabel(src.startDate, day),
      items: [],
    };
    group.items.push(option);
    days.set(day, group);
  }
  const stays: TargetOption[] = src.stays
    .map((s) => ({
      id: targetKey({ kind: "stay", id: s.id }),
      title: s.place.name,
      meta: `${dotDate(s.check_in_date)} - ${dotDate(s.check_out_date)}`,
      category: { value: "stay", label: CATEGORY_LABEL.stay },
      thumbCategory: "stay" as const,
    }))
    .filter((o) => !picked.has(o.id));
  const groups = [...days.values()];
  return stays.length > 0
    ? [...groups, { key: "stays", short: "숙소", date: "", items: stays }]
    : groups;
}

/**
 * 연결 대상의 이름 — 일정 「10.31 · 모구모구 본포」 · 항공편 「항공 · 7C1181 (10/31)」 · 숙소 「숙소 · 호텔 몬토레 긴자」.
 * 대상을 찾지 못하면(그사이 지워졌거나 아직 못 읽었다) null
 */
export function targetLabel(ref: ChecklistTargetRef, src: TargetSources): string | null {
  if (ref.kind === "flight") {
    const f = src.flights.find((x) => x.id === ref.id);
    return f ? `항공 · ${flightCode(f)} (${slashDate(f.dep_date)})` : null;
  }
  if (ref.kind === "stay") {
    const s = src.stays.find((x) => x.id === ref.id);
    return s ? `숙소 · ${s.place.name}` : null;
  }
  const item = src.items.find((x) => x.id === ref.id);
  return item ? `${dayParts(src.startDate, item.day_index).date} · ${itemName(item)}` : null;
}
