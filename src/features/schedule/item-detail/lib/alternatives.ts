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

/** 일정 줄에 연결된 비용 — 전체 수와 그중 합계에서 빠진 수 */
export type LinkedExpenses = { count: number; excluded: number };

/** 그 일정 줄들에 연결된 비용을 센다 — 일정을 지우면 함께 지워지는 대체 장소까지 넘길 수 있다 */
export function linkedExpensesOf(
  expenses: { schedule_item_id: string | null; counted: boolean }[],
  ...itemIds: string[]
): LinkedExpenses {
  const linked = expenses.filter(
    (e) => e.schedule_item_id !== null && itemIds.includes(e.schedule_item_id),
  );
  return { count: linked.length, excluded: linked.filter((e) => !e.counted).length };
}

/**
 * 빼기 확인 창에 덧붙일 비용 안내. 비용은 지워지지 않고 연결만 끊기며, 합계 포함 여부는 그대로 남는다 —
 * 그래서 합계에서 빠진 비용이 있을 때만 그 말을 한다(사용자가 합계 스위치를 다시 켰을 수 있다). 연결된 비용이 없으면 null
 */
export function linkedExpenseNote({ count, excluded }: LinkedExpenses): string | null {
  if (count === 0) return null;
  if (excluded === 0) return `연결된 비용 ${count}건은 가계부에 남아요.`;
  if (excluded === count)
    return `연결된 비용 ${count}건은 가계부에 남지만 합계에서 빠진 채로 남아요.`;
  return `연결된 비용 ${count}건은 가계부에 남아요. 그중 ${excluded}건은 합계에서 빠진 채로 남아요.`;
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
