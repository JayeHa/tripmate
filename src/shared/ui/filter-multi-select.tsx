"use client";

import { multiLabel } from "@/shared/lib/multi-label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import {
  ChipText,
  FilterChipButton,
  type FilterOption,
  MultiOptionRow,
} from "./filter-select-parts";

type FilterMultiSelectProps = {
  /** 아무것도 고르지 않았을 때 칩 글자 · 읽기 프로그램 이름 */
  label: string;
  options: FilterOption[];
  /** 고른 값들. 「전체」 면 빈 배열 */
  value: string[];
  onChange: (value: string[]) => void;
  /** 칩 폭 — auto: 고른 글자만큼, fit: 가장 긴 「이름 외 N」 폭으로 고정. 둘 다 최대 180, 넘치면 말줄임 */
  width?: "auto" | "fit";
  align?: "start" | "end";
};

/**
 * 여럿 고르는 필터(P33 multi) — 칩을 누르면 아래 6px 에 목록, 줄을 누를 때마다 바로 걸리고 목록은 열려 있다(바깥 · Esc 로 닫기).
 * 맨 위 「전체」 를 누르면 모두 푼다. 칩은 고른 것이 있으면 잉크 바탕에 「정원 외 1」(처음 고른 것의 chipIcon 을 앞에).
 * 지금은 PC 드롭다운만 있다 — 모바일 시트(원형 체크 26 + 「적용」)는 모바일에서 여럿 고르는 화면이 생길 때
 */
export function FilterMultiSelect({
  label,
  options,
  value,
  onChange,
  width = "auto",
  align = "start",
}: FilterMultiSelectProps) {
  const picked = options.filter((o) => value.includes(o.value));
  // 걸렸는지는 value 로 본다 — 옵션에서 빠진 값(여행에서 뺀 사람)만 남아도 칩은 걸림, 「전체」 는 안 체크라 눌러서 풀 수 있다
  const active = value.length > 0;
  const text = multiLabel(picked.map((o) => o.label));
  const more = options.length > 1 ? ` 외 ${options.length - 1}` : "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // 칩에는 겹쳐 그린 글자가 있어 이름을 직접 준다 — 고른 값이 있으면 함께 읽힌다
        aria-label={text ? `${label}: ${picked.map((o) => o.label).join(", ")}` : label}
        render={<FilterChipButton selected={active} />}
      >
        <ChipText
          shown={{ text: text ?? label, icon: picked[0]?.chipIcon }}
          widest={
            width === "fit"
              ? [
                  { text: label },
                  ...options.map((o) => ({ text: `${o.label}${more}`, icon: o.chipIcon })),
                ]
              : []
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        className="w-auto max-w-[calc(100vw-2rem)] min-w-50 border-divider"
      >
        <MultiOptionRow label="전체" checked={!active} onCheckedChange={() => onChange([])} />
        <DropdownMenuSeparator className="bg-surface-muted" />
        {options.map((o) => (
          <MultiOptionRow
            key={o.value}
            label={o.label}
            icon={o.icon}
            checked={value.includes(o.value)}
            onCheckedChange={(on) =>
              onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
