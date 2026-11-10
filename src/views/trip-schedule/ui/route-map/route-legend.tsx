import { cn } from "@/shared/lib/utils";

type RouteLegendProps = {
  /** 크기 · 자리 — 모바일 11px · 안쪽 7 10, PC 12px · 안쪽 8 12 */
  className?: string;
};

/** 동선 지도 범례 「━ 전철·버스 ┈ 도보」(흰 · r10) */
export function RouteLegend({ className }: RouteLegendProps) {
  return (
    <div
      className={cn(
        "flex w-max gap-3 rounded-memo font-bold text-ink-700 shadow-[0_1px_4px_rgba(0,0,0,.1)]",
        className,
      )}
    >
      <span className="flex items-center gap-1.25">
        <span aria-hidden="true" className="h-1 w-4.5 rounded-full bg-route-stop" />
        전철·버스
      </span>
      <span className="flex items-center gap-1.25">
        <span aria-hidden="true" className="w-4.5 border-t-3 border-dotted border-[#7D8590]" />
        도보
      </span>
    </div>
  );
}
