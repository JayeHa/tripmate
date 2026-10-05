import { cn } from "cn";
import { Search, X } from "lucide-react";
import type * as React from "react";

/** 크기 — md 44 · r10 · 15px(P3 기본) · sm 36 · r8 · 13px(모달 안 작은 검색) */
const SIZE = {
  md: { box: "h-11 rounded-memo px-3", text: "text-[15px]" },
  sm: { box: "h-9 rounded-button px-2.5", text: "text-[13px]" },
};

type SearchFieldProps = Omit<React.ComponentProps<"input">, "size" | "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  size?: keyof typeof SIZE;
  /** 바깥 칸(label)의 클래스 — 자리 · 폭 */
  boxClassName?: string;
};

/**
 * 검색 칸(P3) — 회색 채움(#F2F3F5) · 테두리 없음(입력 폼 칸과 구분) · 왼쪽 Search 18 #999 · 값이 있으면 ✕(22 원, 지우면 입력칸에 포커스).
 * 입력 속성(ref · onKeyDown · placeholder 등)은 안쪽 input 에 그대로 넘긴다
 */
export function SearchField({
  value,
  onValueChange,
  size = "md",
  boxClassName,
  className,
  ...props
}: SearchFieldProps) {
  const look = SIZE[size];
  return (
    <label className={cn("flex items-center gap-2 bg-surface-muted", look.box, boxClassName)}>
      <Search className="size-4.5 shrink-0 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-400",
          look.text,
          className,
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={(e) => {
            // 지운 뒤 입력칸으로 포커스를 돌려준다 — 버튼이 사라지며 포커스가 창으로 빠지면 Esc 가 창을 닫는다
            e.currentTarget.closest("label")?.querySelector("input")?.focus();
            onValueChange("");
          }}
          className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-line-dashed text-white"
        >
          <X className="size-3" strokeWidth={3} />
        </button>
      )}
    </label>
  );
}
