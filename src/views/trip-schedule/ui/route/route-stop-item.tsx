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
  /** PC — 스크롤 기준선을 지나 지도에 강조된 장소(고른 것이 없을 때). 카드를 올린 모양으로 */
  focused?: boolean;
  /** PC — 첫 줄 오른쪽 「📍5」 */
  showPin?: boolean;
  /** 다녀온 일정 — 흐리게, 패스면 상태 칩 자리에 「패스」 */
  past: PastKind | null;
  /** 다음 역을 다녀왔다 — 그리로 가는 구간도 흐리게(들어오는 이동 줄을 함께 흐리던 타임라인과 같다) */
  nextPast: boolean;
  checklist?: { count: number; href: string };
  vouchers?: { count: number; onOpen: () => void };
  onOpenDetail: () => void;
  /** 「+ 메모」. 모바일은 없다 */
  onAddMemo?: () => void;
  /** 「🗺 지도에서」. PC 는 없다 */
  onShowMap?: () => void;
  onOpenNote: (note: TimelineRow) => void;
  /** 구간 글자 — 다음 줄로 이동 방법 창. 없으면 눌러도 아무 일 없다 */
  onEditMove?: (next: TimelineRow) => void;
};

/**
 * 노선도의 역(장소 카드) 하나와 다음 역까지의 구간. 카드를 누르면 카드 안을 펼치고(메모 · 상세 · 길찾기 · 지도에서),
 * 구간 글자를 누르면 이동 방법 창. `id="item-…"` 로 화면이 그 줄을 찾아 스크롤하고,
 * 지도 핀이 있는 역에는 `data-focus-id` 를 단다(PC 스크롤 강조가 기준선을 지난 역을 찾는다)
 */
export function RouteStopItem({
  stop,
  inSeg,
  prevAt,
  open,
  onToggle,
  focused = false,
  showPin = false,
  past,
  nextPast,
  checklist,
  vouchers,
  onOpenDetail,
  onAddMemo,
  onShowMap,
  onOpenNote,
  onEditMove,
}: RouteStopItemProps) {
  const { row, seg } = stop;
  const hasDetail = open || stop.notes.length > 0 || row.hoursOff;
  return (
    <li id={`item-${row.item.id}`} data-focus-id={row.num !== null ? row.item.id : undefined}>
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
          hovered={focused}
          pinNo={showPin ? row.num : null}
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
              onAddMemo={onAddMemo}
              onShowMap={onShowMap}
              onOpenNote={onOpenNote}
            />
          )}
        </RouteStop>
      </div>
      <NextSegment stop={stop} dim={nextPast} onEditMove={onEditMove} />
    </li>
  );
}

type NextSegmentProps = Pick<RouteStopItemProps, "stop" | "onEditMove"> & {
  /** 다음 역을 다녀왔다 — 흐리게 */
  dim: boolean;
};

/** 다음 역까지의 구간 한 줄. 마지막 역은 없다. 글자를 누르면 이동 방법 창(적을 수 있는 쌍만) */
function NextSegment({ stop, dim, onEditMove }: NextSegmentProps) {
  const { row, seg, next } = stop;
  if (!seg || !next) return null;
  const editMove = stop.editable && onEditMove ? () => onEditMove(next) : undefined;
  return (
    <div className={cn(dim && PAST)}>
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
