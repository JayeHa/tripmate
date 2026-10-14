import type { ChecklistTargetRef } from "@/entities/checklist";

type CardRow = { id: string; stay_id: string | null; alternative_of: string | null };

/**
 * 숙소 「지우기」 로 함께 지워지는 일정 줄 — 그 숙소의 연결 카드(대체 장소 줄 제외)와, 그 카드들의 대체 장소
 * (`alternative_of` cascade). 타임라인 목록(`items`)에는 대체 장소가 없어 따로 받는다
 */
export function stayCardRefs(
  items: readonly CardRow[],
  alternatives: readonly CardRow[],
  stayId: string,
): ChecklistTargetRef[] {
  const cardIds = new Set(
    items.filter((i) => i.stay_id === stayId && i.alternative_of === null).map((i) => i.id),
  );
  const altIds = alternatives
    .filter((a) => a.alternative_of !== null && cardIds.has(a.alternative_of))
    .map((a) => a.id);
  return [...cardIds, ...altIds].map((id) => ({ kind: "schedule_item", id }));
}
