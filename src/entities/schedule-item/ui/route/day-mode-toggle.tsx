import { cn } from "@/shared/lib/utils";

/** 일정 화면의 보기 — 계획(노선도 · 펼침 · 추가) · 기록(다녀온 곳 · 사진 · 한 줄) */
export type DayMode = "plan" | "record";

/** 칸 · 켜진 칸의 색(계획 = 흰 칸, 기록 = 초록 칸) */
const MODES = [
  { mode: "plan", label: "계획", on: "bg-white text-ink-900 shadow-[0_1px_2px_rgba(0,0,0,.08)]" },
  { mode: "record", label: "기록", on: "bg-visited text-white" },
] as const;

type DayModeToggleProps = {
  value: DayMode;
  onChange: (mode: DayMode) => void;
  className?: string;
};

/** 날짜 머리 오른쪽 「계획 | 기록」 세그먼트 — 회색 트랙(안쪽 3 · r10) · 칸 r8 · 12/700, 안 켜진 칸 글자는 연회색 */
export function DayModeToggle({ value, onChange, className }: DayModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="일정 보기"
      className={cn("inline-flex shrink-0 rounded-memo bg-surface-muted p-0.75", className)}
    >
      {MODES.map(({ mode, label, on }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={mode === value}
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-button px-3 py-1.25 text-xs font-bold",
            mode === value ? on : "text-ink-400",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
