import { cn } from "@/shared/lib/utils";

type VisitProgressProps = {
  /** 다녀온 곳 수 */
  done: number;
  /** 그날 역 수 */
  total: number;
  /** 사진 · 기록 글 수 — 0 인 것은 빼고, 모두 0 이면 오른쪽 글을 그리지 않는다 */
  photos?: number;
  notes?: number;
  /** 별점을 매긴 장소 수 */
  rated?: number;
  /** PC 날짜 레일 — 막대 4 + 「4/13」 */
  compact?: boolean;
  className?: string;
};

/** 0~100 */
function percent(done: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

/**
 * 기록 모드의 진행 — 막대(회색 트랙 · 초록 채움, 너비 0.3초) + 「4 / 13곳 다녀왔어요」 · 「📷 6 · 📝 3 · ⭐ 4」.
 * compact 는 날짜 레일용 한 줄(막대 4 + 「4/13」)
 */
export function VisitProgress({
  done,
  total,
  photos = 0,
  notes = 0,
  rated = 0,
  compact = false,
  className,
}: VisitProgressProps) {
  const bar = (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label="다녀온 곳"
      className={cn(
        "block overflow-hidden bg-progress-track",
        compact ? "h-1 flex-1 rounded-xs" : "h-2 rounded-[4px]",
      )}
    >
      <span
        className="block h-full bg-visited transition-[width] duration-300 ease-out"
        style={{ width: `${percent(done, total)}%` }}
      />
    </span>
  );
  const counts = recordCounts(photos, notes, rated);
  if (compact) {
    return (
      <span className={cn("flex items-center gap-1.5", className)}>
        {bar}
        <span className="text-[11px] font-bold text-route-walk-text tabular-nums">
          {done}/{total}
        </span>
      </span>
    );
  }
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {bar}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-extrabold text-ink-900">
          {done} / {total}곳 다녀왔어요
        </span>
        {counts && <span className="text-xs font-bold text-route-walk-text">{counts}</span>}
      </div>
    </div>
  );
}

/** 「📷 6 · 📝 3 · ⭐ 4」 — 0 인 것은 뺀다. 모두 0 이면 null */
function recordCounts(photos: number, notes: number, rated: number): string | null {
  const parts = [
    photos > 0 && `📷 ${photos}`,
    notes > 0 && `📝 ${notes}`,
    rated > 0 && `⭐ ${rated}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
