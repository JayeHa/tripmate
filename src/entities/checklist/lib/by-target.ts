import type { ChecklistItem, ChecklistTargetRef, ChecklistTargetRow } from "../model/types";
import { byDue } from "./groups";
import { targetKey, targetsByItem } from "./targets";

/** 대상(targetKey)마다 연결된 체크리스트 항목 — 상태는 거르지 않는다 */
export type ChecklistIndex = Map<string, ChecklistItem[]>;

/** 대상마다 연결된 항목을 모은다. 연결이 가리키는 항목이 목록에 없으면(그사이 지웠다) 뺀다 */
export function checklistIndex(
  items: readonly ChecklistItem[],
  rows: ChecklistTargetRow[],
): ChecklistIndex {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: ChecklistIndex = new Map();
  for (const [itemId, refs] of targetsByItem(rows)) {
    const item = byId.get(itemId);
    if (!item) continue;
    for (const ref of refs) {
      const key = targetKey(ref);
      out.set(key, [...(out.get(key) ?? []), item]);
    }
  }
  return out;
}

/**
 * 일정 카드가 보일 대상 — 그 카드, 항공편 카드면 그 항공편, 숙소 카드면 그 숙소.
 * 항공편 · 숙소에 연결한 항목도 그 카드에 보인다(연결 고르기에서는 항공편 · 숙소로 고른다)
 */
export function cardTargets(card: {
  id: string;
  flight_id: string | null;
  stay_id: string | null;
}): ChecklistTargetRef[] {
  return [
    { kind: "schedule_item", id: card.id },
    ...(card.flight_id ? [{ kind: "flight" as const, id: card.flight_id }] : []),
    ...(card.stay_id ? [{ kind: "stay" as const, id: card.stay_id }] : []),
  ];
}

/**
 * 대상들에 연결된 **끝나지 않은**(완료가 아닌) 항목 — 겹치면 한 번만, 마감순(목록과 같은 순서).
 * 일정 카드의 「체크리스트 N」 칩 · 상세 칸이 쓴다. 완료하면 빠진다
 */
export function openChecklistFor(
  index: ChecklistIndex,
  refs: ChecklistTargetRef[],
): ChecklistItem[] {
  const seen = new Map<string, ChecklistItem>();
  for (const ref of refs) {
    for (const item of index.get(targetKey(ref)) ?? []) {
      if (item.status !== "done") seen.set(item.id, item);
    }
  }
  return [...seen.values()].sort(byDue);
}

/**
 * 대상들에 연결된 항목 수(상태 상관없이, 겹치면 한 번) — 대상을 지우면 이 연결이 풀린다고 알릴 때
 */
export function checklistCountFor(index: ChecklistIndex, refs: ChecklistTargetRef[]): number {
  const ids = new Set(refs.flatMap((ref) => index.get(targetKey(ref))?.map((i) => i.id) ?? []));
  return ids.size;
}

/**
 * 일정 카드들에 직접 연결된 항목 수(상태 상관없이, 겹치면 한 번) — 일정을 지우면 이 연결이 풀린다고 알릴 때.
 * 그 카드의 숙소 · 항공편에 연결된 항목은 세지 않는다(일정을 지워도 그대로다)
 */
export function linkedChecklistCount(index: ChecklistIndex, scheduleItemIds: string[]): number {
  return checklistCountFor(
    index,
    scheduleItemIds.map((id) => ({ kind: "schedule_item", id })),
  );
}

/** 지우기 · 빼기 확인창에 덧붙일 안내 — 항목은 노트에 남고 연결만 풀린다. 연결이 없으면 null */
export function checklistUnlinkNote(count: number): string | null {
  return count > 0 ? `연결된 체크리스트 ${count}개는 연결만 풀리고 노트에 남아요.` : null;
}
