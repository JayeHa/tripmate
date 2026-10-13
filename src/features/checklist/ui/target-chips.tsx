"use client";

import { type ChecklistTargetRef, targetKey } from "@/entities/checklist";

import { targetLabel } from "../lib/target-options";
import { useTargetSources } from "../model/use-target-sources";

type TargetChipsProps = { tripId: string; targets: ChecklistTargetRef[] };

/** 읽기 화면의 「연결된 일정」 칩(28 · 13/600 회색 바탕). 이름을 찾은 대상만 그리고, 하나도 없으면 칸을 그리지 않는다 */
export function TargetChips({ tripId, targets }: TargetChipsProps) {
  const sources = useTargetSources(tripId);
  const chips = sources
    ? targets.flatMap((ref) => {
        const label = targetLabel(ref, sources);
        return label ? [{ key: targetKey(ref), label }] : [];
      })
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
