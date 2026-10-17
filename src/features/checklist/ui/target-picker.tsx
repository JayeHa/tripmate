"use client";

import { X } from "lucide-react";

import { type ChecklistTargetRef, targetFromKey, targetKey } from "@/entities/checklist";
import { CategoryThumb, findLinkPick, ScheduleLinkField } from "@/entities/schedule-item";

import { targetGroups, targetLabel } from "../lib/target-options";
import { useTargetSources } from "../model/use-target-sources";

type TargetPickerProps = {
  tripId: string;
  value: ChecklistTargetRef | null;
  onChange: (target: ChecklistTargetRef | null) => void;
};

/**
 * 「연결된 일정」 하나만 고르는 칸(바우처) — 공용 일정 연결 칸에 체크리스트와 같은 고르기 창(날마다 일정 카드 · 항공편, 맨 끝 숙소).
 * 고른 대상이 창 목록에 없으면(대체 장소가 됐거나 그사이 지워짐) 회색 줄에 이름(못 찾으면 「찾을 수 없는 일정」) + ✕ 로 그려 풀 수 있게 한다
 */
export function TargetPicker({ tripId, value, onChange }: TargetPickerProps) {
  const sources = useTargetSources(tripId);
  const groups = sources
    ? targetGroups(sources, new Set()).map((g) => ({
        ...g,
        items: g.items.map((item) => ({
          ...item,
          thumb: <CategoryThumb category={item.thumbCategory} size="sm" />,
        })),
      }))
    : [];
  const key = value ? targetKey(value) : null;
  if (value && sources && !findLinkPick(groups, key)) {
    const label = targetLabel(value, sources);
    return (
      <div className="flex h-11 items-center gap-2 rounded-memo bg-surface-muted pr-2 pl-3">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{label}</span>
        <button
          type="button"
          aria-label={`${label} 연결 풀기`}
          onClick={() => onChange(null)}
          className="flex size-7 items-center justify-center text-ink-500"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }
  return (
    <ScheduleLinkField
      value={key}
      onChange={(k) => onChange(k ? targetFromKey(k) : null)}
      groups={groups}
    />
  );
}
