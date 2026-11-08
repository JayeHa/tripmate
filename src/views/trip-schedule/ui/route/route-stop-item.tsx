import type { ReactNode } from "react";

import {
  CATEGORY_LABEL,
  itemName,
  type PastKind,
  ReservationBadge,
  routeLineStyle,
  RouteSegmentRow,
  RouteStop,
  type RouteStopData,
  segmentChip,
  segmentMeta,
  SkippedBadge,
  type TimelineRow,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { StopDetail } from "./stop-detail";

type LatLng = { lat: number; lng: number };

/** 다녀온 일정의 모양 — 흐리게 · 색 빼기 */
const PAST = "opacity-50 grayscale";

/** 둘째 줄 앞 카테고리 글자 색 */
const CATEGORY_TEXT: Record<NonNullable<TimelineRow["category"]>, string> = {
  sight: "text-cat-sight",
  food: "text-cat-food",
  cafe: "text-cat-cafe",
  shop: "text-cat-shop",
  rest: "text-cat-rest",
  stay: "text-cat-stay",
  air: "text-cat-air",
};

type RouteStopItemProps = {
  stop: RouteStopData;
  /** 들어오는 구간(직전 역의 구간). 첫 역은 null */
  inSeg: RouteStopData["seg"];
  /** 직전 역의 좌표 — 「길찾기」 출발지 */
  prevAt: LatLng | null;
  open: boolean;
  onToggle: () => void;
  /** 다녀온 일정 — 흐리게, 패스면 상태 칩 자리에 「패스」 */
  past: PastKind | null;
  /** 다음 역을 다녀왔다 — 그리로 가는 구간도 흐리게(들어오는 이동 줄을 함께 흐리던 타임라인과 같다) */
  nextPast: boolean;
  checklist?: { count: number; href: string };
  vouchers?: { count: number; onOpen: () => void };
  onOpenDetail: () => void;
  onShowMap: () => void;
  onOpenNote: (note: TimelineRow) => void;
  /** 이동 칩 — 다음 줄로 이동 방법 창. 없으면 칩을 눌러도 아무 일 없다 */
  onEditMove?: (next: TimelineRow) => void;
};

/**
 * 노선도의 역 하나와 다음 역까지의 구간. 역을 누르면 펼치고(메모 · 상세 · 길찾기 · 지도에서), 이동 칩을 누르면 이동 방법 창.
 * `id="item-…"` 로 화면이 그 줄을 찾아 스크롤한다
 */
export function RouteStopItem({
  stop,
  inSeg,
  prevAt,
  open,
  onToggle,
  past,
  nextPast,
  checklist,
  vouchers,
  onOpenDetail,
  onShowMap,
  onOpenNote,
  onEditMove,
}: RouteStopItemProps) {
  const { row, seg, next } = stop;
  const hasDetail = open || stop.notes.length > 0 || row.hoursOff;
  const editMove = stop.editable && next && onEditMove ? () => onEditMove(next) : undefined;
  return (
    <li id={`item-${row.item.id}`}>
      <div className={cn(past && PAST)}>
        <RouteStop
          time={row.time}
          name={itemName(row.item)}
          badge={<StatusBadge row={row} past={past} />}
          sub={subLine(row)}
          kind={stop.kind}
          tone="plan"
          inLine={inSeg && routeLineStyle(inSeg.mode, "plan")}
          outLine={seg && routeLineStyle(seg.mode, "plan")}
          selected={open}
          onClick={onToggle}
        >
          {hasDetail && (
            <StopDetail
              stop={stop}
              open={open}
              prevAt={prevAt}
              checklist={checklist}
              vouchers={vouchers}
              onOpenDetail={onOpenDetail}
              onShowMap={onShowMap}
              onOpenNote={onOpenNote}
            />
          )}
        </RouteStop>
      </div>
      {seg && next && (
        <div className={cn(nextPast && PAST)}>
          <RouteSegmentRow
            mode={seg.mode}
            tone="plan"
            line={routeLineStyle(seg.mode, "plan")}
            chip={segmentChip(seg)}
            meta={segmentMeta(seg)}
            onClick={editMove}
            label={`${itemName(row.item)} → ${itemName(next.item)} 이동 방법`}
          />
        </div>
      )}
    </li>
  );
}

type StatusBadgeProps = { row: TimelineRow; past: PastKind | null };

/** 이름 옆 칩 — 패스한 곳은 「패스」, 그 밖은 예약 상태(없으면 없음) */
function StatusBadge({ row, past }: StatusBadgeProps) {
  if (past === "skipped") return <SkippedBadge />;
  return row.status ? <ReservationBadge status={row.status} className="shrink-0" /> : null;
}

/** 둘째 줄 「관광(카테고리 색) 설명 · 메모 2」. 숙소 중간 날은 「숙박 2/3박 · 체크아웃 …」, 항공편은 「항공 제주항공 · 7C1181」. 없으면 null */
function subLine(row: TimelineRow): ReactNode {
  const label = row.kind === "flight" ? "항공" : row.category && CATEGORY_LABEL[row.category];
  const text = [
    row.stay?.mode === "mid" ? row.stay.line : descriptionOf(row),
    row.memos.length > 0 && `메모 ${row.memos.length}`,
  ]
    .filter(Boolean)
    .join(" · ");
  if (!label && !text) return null;
  return (
    <>
      {label && (
        <span
          className={cn(
            "mr-1.5 font-bold",
            row.category ? CATEGORY_TEXT[row.category] : "text-ink-900",
          )}
        >
          {label}
        </span>
      )}
      {text}
    </>
  );
}

/** 장소는 장소 설명, 항공편 · 그 밖은 일정 설명 */
function descriptionOf(row: TimelineRow): string | null {
  return (row.kind === "place" ? row.item.place?.description : row.item.description) || null;
}
