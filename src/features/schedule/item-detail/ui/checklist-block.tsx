"use client";

import { cardTargets, LinkedChecklist, useLinkedChecklist } from "@/entities/checklist";
import type { ScheduleItem } from "@/entities/schedule-item";

type ChecklistBlockProps = {
  tripId: string;
  item: ScheduleItem;
  onToast: (message: string) => void;
};

/** 일정 상세의 체크리스트 칸 — 이 일정(숙소 카드면 그 숙소 포함)에 연결된 끝나지 않은 항목 */
export function ChecklistBlock({ tripId, item, onToast }: ChecklistBlockProps) {
  const { items, complete } = useLinkedChecklist(tripId, cardTargets(item), onToast);
  return <LinkedChecklist tripId={tripId} items={items} onComplete={complete} />;
}
