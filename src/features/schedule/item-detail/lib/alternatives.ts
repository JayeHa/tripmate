import {
  CATEGORY_LABEL,
  type Place,
  PLACE_CATEGORIES,
  type ScheduleItem,
} from "@/entities/schedule-item";

/** 고를 수 있는 장소 한 줄 */
export type AlternativeChoice = { place: Place; meta: string };

/**
 * 저장한 장소에서 대체 장소로 고를 수 있는 것 — 이 일정의 장소 · 이미 붙은 대체 장소의 장소는 뺀다.
 * 이름에 검색어가 들어간 것만(대소문자 무시). 아래 줄은 카테고리 · 설명
 */
export function alternativeChoices(
  saved: Place[],
  main: ScheduleItem,
  alternatives: ScheduleItem[],
  query: string,
): AlternativeChoice[] {
  const taken = new Set([main.place_id, ...alternatives.map((a) => a.place_id)]);
  const q = query.trim().toLowerCase();
  return saved
    .filter((p) => !taken.has(p.id) && (!q || p.name.toLowerCase().includes(q)))
    .map((place) => {
      const category = PLACE_CATEGORIES.find((c) => c === place.category);
      const meta = [category && CATEGORY_LABEL[category], place.description]
        .filter(Boolean)
        .join(" · ");
      return { place, meta };
    });
}

/**
 * 대체 장소 줄이 자기 기록(예약 상태 · 메모 · 일정 링크)을 가졌는지 — 지울 때 한 번 더 묻는다(바꾸기로 밀려난 원래 일정).
 * 메모는 따로 읽으므로(memos) 그 줄의 메모 수를 받는다
 */
export function hasOwnRecord(alt: ScheduleItem, memoCount: number): boolean {
  const links = Array.isArray(alt.links) ? alt.links.length : 0;
  return !!alt.status || memoCount > 0 || links > 0;
}
