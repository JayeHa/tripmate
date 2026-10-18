import { ChevronDown } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { DropdownMenuCheckboxItem, DropdownMenuRadioItem } from "@/shared/ui/dropdown-menu";

export type FilterOption = {
  value: string;
  label: string;
  /** 회색 보조 글(예: 날짜) — 드롭다운은 줄 오른쪽, 시트는 이름 아래 */
  sub?: string;
  /** 줄 왼쪽에 그릴 것(예: 아바타) */
  icon?: React.ReactNode;
  /** 고르면 칩 글자 앞에 그릴 것(예: 18 아바타) — 여럿 고르기는 처음 고른 것 하나 */
  chipIcon?: React.ReactNode;
};

type FilterChipButtonProps = React.ComponentProps<"button"> & { selected: boolean };

/** 칩 모양 버튼(P2) — 고르면 잉크 바탕 · 흰 글자, 아니면 #F2F3F5 · #444 */
export function FilterChipButton({ selected, className, ...props }: FilterChipButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-8.5 max-w-45 shrink-0 items-center gap-1 rounded-full pr-2.5 pl-3 text-[13px] font-bold whitespace-nowrap",
        selected ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-700",
        className,
      )}
      {...props}
    />
  );
}

/** 칩에 보일 수 있는 글 하나 — 앞에 그릴 것(아바타)이 있으면 함께. key 는 옵션 값(이름은 겹칠 수 있다) */
export type ChipCandidate = { key: string; text: string; icon?: React.ReactNode };

type ChipTextProps = {
  shown: ChipCandidate;
  /** fit — 칩이 보일 수 있는 모든 글. 같은 칸에 겹쳐 그려 가장 넓은 것에 폭을 맞춘다. auto 면 빈 배열 */
  widest: ChipCandidate[];
};

/**
 * 칩 글자 + ⌄. fit 이면 보일 수 있는 글을 모두 같은 칸에 겹쳐 그려(보이는 건 지금 글자 하나) 칸 폭이 가장 넓은 것에 맞춰진다 —
 * 재지 않고 CSS 로만 고정한다
 */
export function ChipText({ shown, widest }: ChipTextProps) {
  return (
    <>
      <span className="grid min-w-0">
        {widest.map((c) => (
          <ChipLine key={c.key} text={c.text} icon={c.icon} hidden />
        ))}
        <ChipLine text={shown.text} icon={shown.icon} />
      </span>
      <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
    </>
  );
}

/** 칩 글 한 줄 — 겹쳐 그리는 칸 하나. hidden 이면 자리만 차지한다 */
function ChipLine({ text, icon, hidden }: Omit<ChipCandidate, "key"> & { hidden?: boolean }) {
  return (
    <span
      aria-hidden={hidden}
      className={cn(
        "col-start-1 row-start-1 flex min-w-0 items-center gap-1",
        hidden && "invisible",
      )}
    >
      {icon}
      <span className="truncate">{text}</span>
    </span>
  );
}

/**
 * 목록 한 줄 — 글자(고르면 블루) · 오른쪽 회색 보조 글 · 고른 줄 ✓.
 * 기본 RadioItem 의 `focus:**:text-accent-foreground` 는 자식에 색을 직접 걸어 고른 줄의 블루를 덮는다 — 자식이 줄 색을 따르게 바꾼다
 */
export function OptionRow({ value, label, sub, icon }: FilterOption) {
  return (
    <DropdownMenuRadioItem
      value={value}
      // Base UI 라디오 줄은 기본이 「눌러도 닫히지 않음」 — 고르면 바로 적용 · 닫힘
      closeOnClick
      className="h-10 gap-3 rounded-button pr-9 pl-2.5 text-sm font-semibold text-ink-900 focus:bg-surface-muted focus:text-ink-900 focus:**:text-inherit **:data-[slot=dropdown-menu-radio-item-indicator]:right-2.5 data-checked:text-brand-text focus:data-checked:text-brand-text [&_[data-slot=dropdown-menu-radio-item-indicator]_svg]:text-brand"
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {/* 회색을 지킨다 — 포커스 때 자식 글자 색을 줄 색으로 맞추는 규칙(focus:**:text-inherit)보다 앞서게 */}
      {sub && <span className="shrink-0 text-xs font-medium text-ink-400!">{sub}</span>}
    </DropdownMenuRadioItem>
  );
}

/** 여럿 고르기의 목록 한 줄 — 하나 고르기 줄과 같은 모양, 눌러도 닫히지 않는다 */
export function MultiOptionRow({
  checked,
  onCheckedChange,
  label,
  icon,
}: Pick<FilterOption, "label" | "icon"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      closeOnClick={false}
      className="h-10 gap-3 rounded-button pr-9 pl-2.5 text-sm font-semibold text-ink-900 focus:bg-surface-muted focus:text-ink-900 focus:**:text-inherit **:data-[slot=dropdown-menu-checkbox-item-indicator]:right-2.5 data-checked:text-brand-text focus:data-checked:text-brand-text [&_[data-slot=dropdown-menu-checkbox-item-indicator]_svg]:text-brand"
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
    </DropdownMenuCheckboxItem>
  );
}
