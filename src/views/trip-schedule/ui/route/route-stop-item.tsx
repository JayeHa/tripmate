import {
  CATEGORY_LABEL,
  itemName,
  type PastKind,
  ReservationBadge,
  routeLineStyle,
  RouteSegmentRow,
  RouteStop,
  type RouteStopData,
  segmentLabel,
  segmentMeta,
  SkippedBadge,
  type TimelineRow,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { StopDetail } from "./stop-detail";

type LatLng = { lat: number; lng: number };

/** 다녀온 일정의 모양 — 흐리게 · 색 빼기 */
const PAST = "opacity-50 grayscale";

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
  /** 구간 글자 — 다음 줄로 이동 방법 창. 없으면 눌러도 아무 일 없다 */
  onEditMove?: (next: TimelineRow) => void;
};

/**
 * 노선도의 역(장소 카드) 하나와 다음 역까지의 구간. 카드를 누르면 카드 안을 펼치고(메모 · 상세 · 길찾기 · 지도에서),
 * 구간 글자를 누르면 이동 방법 창. `id="item-…"` 로 화면이 그 줄을 찾아 스크롤한다
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
          emoji={row.kind === "flight" ? "✈️" : row.emoji}
          sub={<SubLine row={row} past={past} />}
          kind={stop.kind}
          tone="plan"
          category={row.category}
          inLine={inSeg && routeLineStyle(inSeg.mode, "plan")}
          outLine={seg && routeLineStyle(seg.mode, "plan")}
          selected={open}
          onClick={onToggle}
          expandable
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
            tone="plan"
            line={routeLineStyle(seg.mode, "plan")}
            icon={seg.icon}
            label={segmentLabel(seg)}
            meta={segmentMeta(seg)}
            onClick={editMove}
            ariaLabel={`${itemName(row.item)} → ${itemName(next.item)} 이동 방법`}
          />
        </div>
      )}
    </li>
  );
}

type SubLineProps = { row: TimelineRow; past: PastKind | null };

/**
 * 카드 둘째 줄 — 카테고리 칩(항공편은 「항공」) · 예약 상태 칩(패스한 곳은 「패스」) · 회색 글자.
 * 회색 글자는 「메모 2」, 숙소 중간 날은 「숙박 2/3박 · 체크아웃 …」, 항공편은 「제주항공 · 7C1181」 을 앞에.
 * 장소 설명은 넣지 않는다 — 카드마다 길이가 달라져 일정이 다시 구분되지 않는다(펼침 · 상세에서 본다)
 */
function SubLine({ row, past }: SubLineProps) {
  const label = row.kind === "flight" ? "항공" : row.category && CATEGORY_LABEL[row.category];
  const text = [
    row.stay?.mode === "mid" && row.stay.line,
    row.kind === "flight" && row.item.description,
    row.memos.length > 0 && `메모 ${row.memos.length}`,
  ]
    .filter(Boolean)
    .join(" · ");
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
      {past === "skipped" && <SkippedBadge />}
      {past !== "skipped" && row.status && (
        <ReservationBadge status={row.status} className="shrink-0" />
      )}
      {text && <span className="truncate text-xs text-route-card-meta">{text}</span>}
    </>
  );
}
