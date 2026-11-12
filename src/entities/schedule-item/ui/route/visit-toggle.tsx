import { cn } from "@/shared/lib/utils";

import type { VisitMark } from "../../model/visit";

const PILL =
  "flex h-7.5 shrink-0 items-center rounded-[15px] border text-[13px] font-bold transition-colors";
const OFF = "border-line bg-white text-ink-700";

type VisitToggleRowProps = {
  /** 지금 표시. 없으면 null */
  value: VisitMark | null;
  /** 누른 표시 — 같은 것을 다시 누르면 null(지우기) */
  onChange: (next: VisitMark | null) => void;
};

/**
 * 펼친 카드 맨 아래 방문 토글 줄 — 위 구분선 · 왼쪽 「방문 체크」(표시가 있으면 「다시 누르면 취소」) · 오른쪽 「✓ 다녀왔어요」 · 「패스」.
 * 켜진 것은 다녀옴 초록 · 패스 진회색 채움. 같은 것을 다시 누르면 지운다(확인 창 없음). 계획 · 기록 모드 같다
 */
export function VisitToggleRow({ value, onChange }: VisitToggleRowProps) {
  const pick = (mark: VisitMark) => onChange(value === mark ? null : mark);
  return (
    <div className="flex items-center gap-1.5 border-t border-line-card pt-2">
      <span className="mr-auto text-xs font-bold whitespace-nowrap text-route-card-meta">
        {value ? "다시 누르면 취소" : "방문 체크"}
      </span>
      <button
        type="button"
        aria-pressed={value === "visited"}
        onClick={() => pick("visited")}
        className={cn(
          PILL,
          "px-3",
          value === "visited" ? "border-visited bg-visited text-white" : OFF,
        )}
      >
        ✓ 다녀왔어요
      </button>
      <button
        type="button"
        aria-pressed={value === "skipped"}
        onClick={() => pick("skipped")}
        className={cn(
          PILL,
          "px-3.5",
          value === "skipped" ? "border-pass-strong bg-pass-strong text-white" : OFF,
        )}
      >
        패스
      </button>
    </div>
  );
}

type VisitNowButtonsProps = { onChange: (next: VisitMark) => void };

/** 지금 여기 카드 안 큰 버튼 — 「패스」(회색) + 「✓ 다녀왔어요」(초록 · 남은 폭). 44(PC 40) · r10 */
export function VisitNowButtons({ onChange }: VisitNowButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("skipped")}
        className="flex h-11 shrink-0 items-center justify-center rounded-memo bg-surface-muted px-4.5 text-[15px] font-bold text-ink-700 lg:h-10 lg:text-sm"
      >
        패스
      </button>
      <button
        type="button"
        onClick={() => onChange("visited")}
        className="flex h-11 flex-1 items-center justify-center rounded-memo bg-visited text-[15px] font-extrabold text-white lg:h-10 lg:text-sm"
      >
        ✓ 다녀왔어요
      </button>
    </div>
  );
}
