import { Check, Lock } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** 모양 — circle 26(「골랐다」 선택) · square 22 r6(「끝냈다」 완료) */
const SHAPE = {
  circle: { box: "size-6.5 rounded-full", icon: "size-3.75" },
  square: { box: "size-5.5 rounded-pill-sm", icon: "size-3.5" },
};

type CheckMarkProps = {
  checked: boolean;
  shape?: keyof typeof SHAPE;
  /** 고를 수 없음 — 회색 원 안에 자물쇠(항공편 등) */
  locked?: boolean;
  className?: string;
};

/**
 * 체크 표시(P9) — 미선택 1.5px #C9CDD2, 선택 #3A8BFF + 흰 Check(stroke 3), 잠김 Lock 13 #AAA.
 * 그림만 그린다 — 누르는 영역(44 이상)과 role 은 감싸는 버튼이 맡는다
 */
export function CheckMark({
  checked,
  shape = "circle",
  locked = false,
  className,
}: CheckMarkProps) {
  const look = SHAPE[shape];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border-[1.5px]",
        look.box,
        locked && "border-line bg-surface-muted",
        !locked && (checked ? "border-primary bg-primary" : "border-line-dashed bg-white"),
        className,
      )}
    >
      {checked && !locked && <Check className={cn("text-white", look.icon)} strokeWidth={3} />}
      {locked && <Lock className="size-3.25 text-ink-350" strokeWidth={2.2} />}
    </span>
  );
}
