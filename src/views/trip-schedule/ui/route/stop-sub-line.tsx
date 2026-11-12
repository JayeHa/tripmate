import { format, parseISO } from "date-fns";

import {
  CATEGORY_LABEL,
  PassChip,
  ReservationBadge,
  type StopTone,
  type TimelineRow,
  VisitedChip,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

/** 카테고리 칩 색(연한 바탕 · 진한 글자) */
const CATEGORY_CHIP: Record<NonNullable<TimelineRow["category"]>, string> = {
  sight: "bg-cat-sight-soft text-cat-sight",
  food: "bg-cat-food-soft text-cat-food",
  cafe: "bg-cat-cafe-soft text-cat-cafe",
  shop: "bg-cat-shop-soft text-cat-shop",
  rest: "bg-cat-rest-soft text-cat-rest",
  stay: "bg-cat-stay-soft text-cat-stay",
  air: "bg-cat-air-soft text-cat-air",
};

type StopSubLineProps = {
  row: TimelineRow;
  /** 역 모양 — 방문 표시가 있으면(다녀옴 · 패스) 예약 상태 칩을 숨긴다 */
  tone: StopTone;
  /** 계획 모드 · 여행 중 오늘 다녀온 곳 — 「✓ 다녀옴」 칩 */
  dim: boolean;
  /** 다녀왔어요를 누른 시각(ISO) — 다녀온 곳은 「10:52 도착」 */
  markedAt: string | null;
};

/**
 * 카드 둘째 줄 — 카테고리 칩(항공편은 「항공」) · 방문 칩(「패스」 · 오늘 다녀온 곳 「✓ 다녀옴」) 또는 예약 상태 칩 · 회색 글자.
 * 회색 글자는 「메모 2」, 숙소 중간 날은 「숙박 2/3박 · 체크아웃 …」, 항공편은 「제주항공 · 7C1181」 을 앞에.
 * 장소 설명은 넣지 않는다 — 카드마다 길이가 달라져 일정이 다시 구분되지 않는다(펼침 · 상세에서 본다).
 * 방문 표시가 있으면 예약 상태 칩은 숨긴다. 기록 모드: 다녀온 곳은 「10:52 도착」, 남은 곳은 메모 수를 숨긴다
 */
export function StopSubLine({ row, tone, dim, markedAt }: StopSubLineProps) {
  const label = row.kind === "flight" ? "항공" : row.category && CATEGORY_LABEL[row.category];
  const done = tone === "done";
  const marked = done || tone === "visited" || tone === "pass";
  return (
    <>
      {label && (
        <span
          className={cn(
            "shrink-0 rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold",
            row.category ? CATEGORY_CHIP[row.category] : "bg-cat-move-soft text-ink-700",
          )}
        >
          {label}
        </span>
      )}
      {tone === "pass" && <PassChip />}
      {dim && <VisitedChip />}
      {!marked && row.status && <ReservationBadge status={row.status} className="shrink-0" />}
      <span className="truncate text-xs text-route-card-meta empty:hidden">
        {done ? arrivedText(markedAt) : metaText(row, tone !== "todo")}
      </span>
    </>
  );
}

/** 「10:52 도착」. 시각을 모르면 "" */
function arrivedText(markedAt: string | null): string {
  return markedAt ? `${format(parseISO(markedAt), "HH:mm")} 도착` : "";
}

/** 회색 글자 — 숙소 중간 날 · 항공편 정보 · 메모 수(memos 가 false 면 뺀다) */
function metaText(row: TimelineRow, memos: boolean): string {
  return [
    row.stay?.mode === "mid" && row.stay.line,
    row.kind === "flight" && row.item.description,
    memos && row.memos.length > 0 && `메모 ${row.memos.length}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
