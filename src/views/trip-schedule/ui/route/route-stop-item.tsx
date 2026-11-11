import {
  itemName,
  type PastKind,
  routeLineStyle,
  RouteSegmentRow,
  RouteStop,
  type RouteStopData,
  type RouteTone,
  segmentLabel,
  segmentMeta,
  type TimelineRow,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { StopDetail } from "./stop-detail";
import {
  HereChip,
  RatingRow,
  RecordNote,
  stopLook,
  type StopRecord,
  VisitedButton,
} from "./stop-record";
import { StopSubLine } from "./stop-sub-line";

export type { StopRecord } from "./stop-record";

type LatLng = { lat: number; lng: number };

/** 다녀온 일정의 모양 — 흐리게 · 색 빼기 */
const PAST = "opacity-50 grayscale";

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
  /** PC — 카드에 올렸다 · 내렸다(지도 핀을 키운다) */
  onHover?: (hovering: boolean) => void;
  /** PC — 다음 구간을 지도에서 진하게 그리는 중(구간 글자에 올렸다) — 글자에 밑줄 */
  segHighlight?: boolean;
  onSegHover?: (hovering: boolean) => void;
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
  /** 기록 모드 — 다녀감으로 칠하고 펼치지 않는다(지금 여기면 「✓ 다녀왔어요」). 계획 모드는 없다 */
  record?: StopRecord;
};

/**
 * 노선도의 역(장소 카드) 하나와 다음 역까지의 구간. 카드를 누르면 카드 안을 펼치고(메모 · 상세 · 길찾기 · 지도에서),
 * 구간 글자를 누르면 이동 방법 창. `id="item-…"` 로 화면이 그 줄을 찾아 스크롤하고,
 * 지도 핀이 있는 역에는 `data-focus-id` 를 단다(PC 스크롤 강조가 기준선을 지난 역을 찾는다).
 * 기록 모드는 표식 · 선 · 카드를 다녀감으로 칠하고(흐리게 하는 「다녀온 일정」 회색은 쓰지 않는다) 카드 안을 펼치지 않는다
 */
export function RouteStopItem({
  stop,
  inSeg,
  prevAt,
  open,
  onToggle,
  focused = false,
  showPin = false,
  onHover,
  segHighlight = false,
  onSegHover,
  past,
  nextPast,
  checklist,
  vouchers,
  onOpenDetail,
  onAddMemo,
  onShowMap,
  onOpenNote,
  onEditMove,
  record,
}: RouteStopItemProps) {
  const { row, seg } = stop;
  const look = stopLook(record, past, nextPast);
  return (
    <li id={`item-${row.item.id}`} data-focus-id={row.num !== null ? row.item.id : undefined}>
      <div className={cn(look.faded && PAST)}>
        <RouteStop
          time={row.time}
          name={itemName(row.item)}
          emoji={row.kind === "flight" ? "✈️" : row.emoji}
          aside={look.tone === "current" && <HereChip />}
          sub={
            <StopSubLine
              row={row}
              skipped={look.skipped}
              tone={look.tone}
              markedAt={look.markedAt}
            />
          }
          kind={stop.kind}
          tone={look.tone}
          category={row.category}
          inLine={inSeg && routeLineStyle(inSeg.mode, look.inTone)}
          outLine={seg && routeLineStyle(seg.mode, look.outTone)}
          selected={open}
          hovered={focused}
          pinNo={showPin ? row.num : null}
          onClick={onToggle}
          onHover={onHover}
          expandable={!record}
        >
          <StopInside
            record={record}
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
        </RouteStop>
      </div>
      <NextSegment
        stop={stop}
        tone={look.outTone}
        dim={look.fadedNext}
        onEditMove={onEditMove}
        highlight={segHighlight}
        onHover={onSegHover}
      />
    </li>
  );
}

type StopInsideProps = Pick<
  RouteStopItemProps,
  | "record"
  | "stop"
  | "open"
  | "prevAt"
  | "checklist"
  | "vouchers"
  | "onOpenDetail"
  | "onAddMemo"
  | "onShowMap"
  | "onOpenNote"
>;

/**
 * 카드 안 아래 칸. 기록 모드는 다녀온 장소의 별점 줄 · 기록 · 지금 여기의 「✓ 다녀왔어요」, 계획 모드는 날짜 메모 · 휴무(늘) · 펼친 칸.
 * 그릴 것이 없으면 null(RouteStop 이 빈 칸을 숨긴다)
 */
function StopInside({ record, ...detail }: StopInsideProps) {
  if (record) return <RecordInside record={record} />;
  const { stop, open } = detail;
  if (!open && stop.notes.length === 0 && !stop.row.hoursOff) return null;
  return <StopDetail {...detail} />;
}

type RecordInsideProps = { record: StopRecord };

/** 기록 모드의 카드 안 — 다녀온 장소면 별점 줄 · 기록, 지금 여기면 「✓ 다녀왔어요」, 그 밖은 비운다 */
function RecordInside({ record }: RecordInsideProps) {
  if (record.rating || record.note) {
    return (
      <>
        {record.rating && <RatingRow {...record.rating} />}
        {record.note && <RecordNote {...record.note} />}
      </>
    );
  }
  return record.onVisited ? <VisitedButton onClick={record.onVisited} /> : null;
}

type NextSegmentProps = Pick<RouteStopItemProps, "stop" | "onEditMove"> & {
  tone: RouteTone;
  /** 다음 역을 다녀왔다 — 흐리게 */
  dim: boolean;
  highlight: boolean;
  onHover?: (hovering: boolean) => void;
};

/** 다음 역까지의 구간 한 줄. 마지막 역은 없다. 글자를 누르면 이동 방법 창(적을 수 있는 쌍만) */
function NextSegment({ stop, tone, dim, onEditMove, highlight, onHover }: NextSegmentProps) {
  const { row, seg, next } = stop;
  if (!seg || !next) return null;
  const editMove = stop.editable && onEditMove ? () => onEditMove(next) : undefined;
  return (
    <div className={cn(dim && PAST)}>
      <RouteSegmentRow
        tone={tone}
        line={routeLineStyle(seg.mode, tone)}
        icon={seg.icon}
        label={segmentLabel(seg)}
        meta={segmentMeta(seg)}
        highlight={highlight}
        onHover={onHover}
        onClick={editMove}
        ariaLabel={`${itemName(row.item)} → ${itemName(next.item)} 이동 방법`}
      />
    </div>
  );
}
