import { cn } from "@/shared/lib/utils";

import { SUMMARY_MAX } from "../lib/edit-draft";

type SummaryFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** 모바일은 「(선택)」 을 붙인 44 칸, PC 는 머리 안의 42 칸 */
  layout: "mobile" | "pc";
};

/** 레이아웃별 크기 */
const LOOK = {
  mobile: { box: "px-5 pb-3.5", input: "h-11 text-[15px]" },
  pc: { box: "", input: "h-10.5 text-sm" },
};

/** 편집하는 날의 하루 요약 칸(100자). 「완료」 에서 순서와 함께 저장된다 */
export function SummaryField({ value, onChange, layout }: SummaryFieldProps) {
  const look = LOOK[layout];
  return (
    <label className={cn("flex flex-col gap-1.5", look.box)}>
      <span className="text-[13px] font-bold text-ink-700">
        하루 요약
        {layout === "mobile" && <span className="font-medium text-ink-350"> (선택)</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={SUMMARY_MAX}
        placeholder="예: 파르코 라멘 → 파크 14:00 → 굿즈 쇼핑"
        className={cn(
          "w-full rounded-memo border border-line bg-white px-3 text-ink-900 outline-none placeholder:text-ink-350 focus:border-primary",
          look.input,
        )}
      />
    </label>
  );
}
