"use client";

import { type ChecklistTargetRef, targetKey } from "@/entities/checklist";

import { targetLabel } from "../lib/target-options";
import { useTargetSources } from "../model/use-target-sources";

type TargetChipsProps = { tripId: string; targets: ChecklistTargetRef[] };

/**
 * 읽기 화면의 「연결된 일정」 칩(28 · 13/600 회색 바탕). 이름을 못 찾은 대상은 「찾을 수 없는 일정」.
 * 연결이 없거나 일정 · 항공편 · 숙소를 아직 못 읽었으면 칸을 그리지 않는다
 */
export function TargetChips({ tripId, targets }: TargetChipsProps) {
  const sources = useTargetSources(tripId);
  const chips = sources
    ? targets.map((ref) => ({ key: targetKey(ref), label: targetLabel(ref, sources) }))
    : [];
  if (chips.length === 0) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[13px] font-bold text-ink-400">연결된 일정</h3>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.key}
            className="h-7 max-w-full truncate rounded-full bg-surface-muted px-2.5 text-[13px]/7 font-semibold text-ink-700"
          >
            {c.label}
          </span>
        ))}
      </div>
    </section>
  );
}
