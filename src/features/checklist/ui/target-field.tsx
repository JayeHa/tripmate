"use client";

import { X } from "lucide-react";

import { type ChecklistTargetRef, targetFromKey, targetKey } from "@/entities/checklist";
import { CategoryThumb, ScheduleLinkField } from "@/entities/schedule-item";

import { targetGroups, targetLabel } from "../lib/target-options";
import { useTargetSources } from "../model/use-target-sources";

type TargetFieldProps = {
  tripId: string;
  value: ChecklistTargetRef[];
  onChange: (targets: ChecklistTargetRef[]) => void;
};

/**
 * 「연결된 일정」 칸 — 고른 대상마다 회색 줄(40 · r10, 이름 14/600 · ✕), 아래 「+ 일정 연결」(공용 일정 연결 칸, 늘 비어 있다).
 * 고르기 창은 날마다 일정 카드 · 항공편, 맨 끝 숙소 묶음이고 이미 고른 것은 빠진다. 창의 「연결 안 함」 은 아무것도 바꾸지 않는다.
 * 이름을 못 찾은 대상도 「찾을 수 없는 일정」 줄로 그려 ✕ 로 풀 수 있게 한다(목록을 읽기 전에는 줄을 그리지 않는다)
 */
export function TargetField({ tripId, value, onChange }: TargetFieldProps) {
  const sources = useTargetSources(tripId);
  const picked = new Set(value.map(targetKey));
  const groups = sources
    ? targetGroups(sources, picked).map((g) => ({
        ...g,
        items: g.items.map((item) => ({
          ...item,
          thumb: <CategoryThumb category={item.thumbCategory} size="sm" />,
        })),
      }))
    : [];
  const rows = sources ? value.map((ref) => ({ ref, label: targetLabel(ref, sources) })) : [];
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map(({ ref, label }) => (
        <div
          key={targetKey(ref)}
          className="flex h-10 items-center gap-2 rounded-memo bg-surface-muted pr-2 pl-3"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
            {label}
          </span>
          <button
            type="button"
            aria-label={`${label} 연결 풀기`}
            onClick={() => onChange(value.filter((t) => targetKey(t) !== targetKey(ref)))}
            className="flex size-7 items-center justify-center text-ink-500"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <ScheduleLinkField
        value={null}
        onChange={(key) => {
          const ref = key ? targetFromKey(key) : null;
          if (ref) onChange([...value, ref]);
        }}
        groups={groups}
        placeholder="+ 일정 연결"
        clearable={false}
      />
    </div>
  );
}
