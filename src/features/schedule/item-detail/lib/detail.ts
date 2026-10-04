import {
  hoursOnDay,
  isHttpUrl,
  type Place,
  planLinksOf,
  type ReservationStatus,
  type ScheduleItem,
  statusOf,
  WEEK_DAY_LABEL,
  WEEK_DAYS,
  weekHoursOf,
} from "@/entities/schedule-item";
import type { TablesUpdate } from "@/shared/api/supabase/database.types";
import type { LinkDraft } from "@/shared/ui/link-rows";

/** 장소 정보 표의 한 줄 */
export type InfoRow = {
  label: string;
  value: string;
  /** 그날 휴무 — 빨갛게 */
  off?: boolean;
  /** 요일별 운영시간 7일(「요일별 보기」 로 펼친다). 요일별이 아니면 없다 */
  week?: string;
};

/** 별점 줄: 「★ 4.7 (1,355)」 */
function ratingText(place: Place): string | null {
  if (place.rating == null) return null;
  const reviews = place.review_count ? ` (${place.review_count.toLocaleString("en-US")})` : "";
  return `★ ${place.rating.toFixed(1)}${reviews}`;
}

/** 요일별 운영시간 한 줄 요약: 「월 11:00–22:00 · … · 일 휴무」. 안 적은 요일은 뺀다 */
function weekSummary(place: Place): string | null {
  const week = weekHoursOf(place.hours_week);
  if (!week) return null;
  return WEEK_DAYS.filter((d) => d in week)
    .map((d) => `${WEEK_DAY_LABEL[d]} ${week[d] ?? "휴무"}`)
    .join(" · ");
}

/** 운영시간 줄. 그 일정 요일 값을 대표로, 요일별이면 7일 요약을 붙인다. 아무것도 없으면 null */
function hoursRow(place: Place, dow: number | null): InfoRow | null {
  const day = hoursOnDay(place, dow);
  const week = weekSummary(place) ?? undefined;
  if (!day && !week) return null;
  return { label: "운영시간", value: day?.text ?? "요일별로 달라요", off: day?.off, week };
}

/**
 * 일정 상세의 장소 정보 표 — 설명 · 주소(로마자 + 상세 위치 · 현지어 · 한글 줄) · 별점 · 운영시간. 빈 칸은 줄을 뺀다.
 * dow 는 그 일정 날의 요일(0 = 일요일) — 운영시간은 그날 값을 대표로 보인다
 */
export function placeInfoRows(place: Place, dow: number | null): InfoRow[] {
  // 주소는 장소 입력과 같은 순서로 함께 적는다 — 로마자(+ 상세 위치) · 현지어 · 한글, 한 줄씩
  const address = [
    [place.address, place.address_detail].filter(Boolean).join(" · "),
    place.address_local,
    place.address_ko,
  ]
    .filter(Boolean)
    .join("\n");
  const rows: (InfoRow | null)[] = [
    place.description ? { label: "설명", value: place.description } : null,
    address ? { label: "주소", value: address } : null,
    ratingText(place) ? { label: "별점", value: ratingText(place) ?? "" } : null,
    hoursRow(place, dow),
  ];
  return rows.filter((r): r is InfoRow => r !== null);
}

/** 「이번 일정」 수정 칸의 값 — 입력 칸이 다루는 문자열 그대로 */
export type PlanDraft = {
  /** note · flight 의 제목(place 는 장소 이름이라 여기서 고치지 않는다) */
  name: string;
  status: ReservationStatus | null;
  /** HH:mm 또는 빈 문자열 */
  time: string;
  links: LinkDraft[];
};

/** 일정에서 수정 칸의 처음 값 */
export function planDraftOf(item: ScheduleItem): PlanDraft {
  return {
    name: item.name ?? "",
    status: statusOf(item),
    time: item.start_time?.slice(0, 5) ?? "",
    links: planLinksOf(item).map((l) => ({ ...l })),
  };
}

export type PlanPatchResult =
  { ok: true; patch: TablesUpdate<"schedule_items"> } | { ok: false; error: string };

/**
 * 수정 칸 값을 저장할 일정 칸으로. 빈 링크 줄은 버리고, 주소가 http(s) 가 아니면 그 줄을 짚어 오류.
 * place 는 상태 · 시간 · 링크만, note · flight 는 제목 · 시간(상태 · 링크는 장소 일정에만 쓴다)
 */
function fullPatch(item: ScheduleItem, draft: PlanDraft): PlanPatchResult {
  const start_time = draft.time || null;
  if (start_time && !/^\d{2}:\d{2}$/.test(start_time))
    return { ok: false, error: "시간을 확인해 주세요" };
  if (item.kind !== "place") {
    const name = draft.name.trim();
    if (!name) return { ok: false, error: "제목을 입력해 주세요" };
    return { ok: true, patch: { name: name.slice(0, 100), start_time } };
  }
  const links = draft.links
    .map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
    .filter((l) => l.url);
  if (links.some((l) => !isHttpUrl(l.url))) {
    return { ok: false, error: "일정 링크 주소는 http:// 나 https:// 로 시작해야 해요" };
  }
  return { ok: true, patch: { status: draft.status, start_time, links } };
}

/**
 * 저장할 칸 — 「수정」 을 연 때(initial)와 **달라진 칸만**. 그사이 일행이 다른 칸(예: 링크)을 바꿨어도
 * 내가 손대지 않은 칸은 보내지 않아 덮어쓰지 않는다. 바뀐 칸이 없으면 빈 patch
 */
export function toPlanPatch(
  item: ScheduleItem,
  draft: PlanDraft,
  initial: PlanDraft,
): PlanPatchResult {
  const next = fullPatch(item, draft);
  if (!next.ok) return next;
  const base = fullPatch(item, initial);
  const before: Record<string, unknown> = base.ok ? base.patch : {};
  const patch = Object.fromEntries(
    Object.entries(next.patch).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])),
  );
  return { ok: true, patch };
}
