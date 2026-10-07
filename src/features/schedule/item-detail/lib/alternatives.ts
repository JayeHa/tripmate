import {
  CATEGORY_LABEL,
  itemName,
  type Place,
  PLACE_CATEGORIES,
  type ScheduleItem,
} from "@/entities/schedule-item";
import { euro } from "@/shared/lib/josa";

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
 * 대체 장소 줄이 자기 기록(예약 상태 · 메모 · 일정 링크 · 연결된 비용)을 가졌는지 — 지울 때 한 번 더 묻는다(바꾸기로 밀려난 원래 일정).
 * 메모 · 비용은 따로 읽으므로 그 줄의 수를 받는다
 */
export function hasOwnRecord(alt: ScheduleItem, memoCount: number, expenseCount = 0): boolean {
  const links = Array.isArray(alt.links) ? alt.links.length : 0;
  return !!alt.status || memoCount > 0 || links > 0 || expenseCount > 0;
}

/** 그 일정 줄에 연결된 비용 수 */
export function linkedExpenseCount(
  expenses: { schedule_item_id: string | null }[],
  itemId: string,
): number {
  return expenses.filter((e) => e.schedule_item_id === itemId).length;
}

/** 「「A」 대신 「B」으로」 — 바꾸기 확인창 · 토스트가 같이 쓰는 앞부분 */
function swapPhrase(main: ScheduleItem, alt: ScheduleItem): string {
  const to = itemName(alt);
  return `「${itemName(main)}」 대신 「${to}」${euro(to)}`;
}

/** 바꾸기 확인창 제목 */
export function swapQuestion(main: ScheduleItem, alt: ScheduleItem): string {
  return `${swapPhrase(main, alt)} 바꿀까요?`;
}

/** 바꾸기가 끝난 뒤 토스트 */
export function swapDoneMessage(main: ScheduleItem, alt: ScheduleItem): string {
  return `${swapPhrase(main, alt)} 바꿨어요`;
}
