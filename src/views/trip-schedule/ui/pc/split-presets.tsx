import { Columns2, Map as MapIcon, PanelLeftOpen } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { activePreset, type SplitPreset } from "../../lib/split";

const PRESET_ICON = { list: PanelLeftOpen, half: Columns2, map: MapIcon } satisfies Record<
  SplitPreset["key"],
  typeof MapIcon
>;

type SplitPresetsProps = {
  presets: SplitPreset[];
  width: number;
  onSelect: (width: number) => void;
};

/** 지도 왼쪽 위 「일정 크게 · 반반 · 지도 크게」. 지금 너비에 맞는 것이 잉크색 */
export function SplitPresets({ presets, width, onSelect }: SplitPresetsProps) {
  // 좁은 창에서 두 프리셋이 같은 너비가 돼도 하나만 켜지게, 판정은 한 번만 한다
  const active = activePreset(presets, width);
  return (
    <div className="absolute top-3 left-3 z-10 flex gap-0.5 rounded-memo bg-white p-0.75 shadow-card">
      {presets.map((p) => {
        const Icon = PRESET_ICON[p.key];
        const on = p.key === active;
        return (
          <button
            key={p.key}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(p.width)}
            className={cn(
              "flex h-7.5 items-center gap-1.25 rounded-[7px] px-2.5 text-xs font-bold",
              on ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-surface-muted",
            )}
          >
            <Icon className="size-3.75" />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
