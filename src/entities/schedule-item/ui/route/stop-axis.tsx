import { cn } from "@/shared/lib/utils";

import type { RouteLine } from "../../lib/route";
import type { StopKind } from "../../lib/route-day";
import type { PlaceCategory } from "../../model/place";
import { RouteLineBar } from "./route-line";
import { StopMarker, type StopTone } from "./stop-marker";

type StopAxisProps = {
  /** 「HH:mm」. 없으면 빈 칸 */
  time: string | null;
  kind: StopKind;
  tone: StopTone;
  category: PlaceCategory | null;
  inLine: RouteLine | null;
  outLine: RouteLine | null;
  /** 접힌 패스 줄 */
  slim?: boolean;
};

/** 앞 두 칸 — 시각(패스는 회색) · 선과 표식(표식은 위에서 24, 접힌 패스 줄은 22) */
export function StopAxis({
  time,
  kind,
  tone,
  category,
  inLine,
  outLine,
  slim = false,
}: StopAxisProps) {
  return (
    <>
      <span
        className={cn(
          "pr-1 text-right text-[13px]/4 font-extrabold tabular-nums",
          slim ? "pt-3.5 text-pass-muted" : "pt-4.25 text-ink-900",
        )}
      >
        {time}
      </span>
      <span className="relative">
        <RouteLineBar line={inLine} className={slim ? "top-0 h-5.5" : "top-0 h-6"} />
        <RouteLineBar line={outLine} className={slim ? "top-5.5 bottom-0" : "top-6 bottom-0"} />
        <StopMarker
          kind={kind}
          tone={tone}
          category={category}
          className={cn("absolute left-1/2 z-1 -translate-1/2", slim ? "top-5.5" : "top-6")}
        />
      </span>
    </>
  );
}
