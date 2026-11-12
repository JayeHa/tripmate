import {
  itemName,
  PASS_LINE,
  type RouteLine,
  routeLineStyle,
  type RouteMode,
  RouteSegmentRow,
  RouteStop,
  type RouteStopData,
  type RouteTone,
  segmentLabel,
  segmentMeta,
  type TimelineRow,
  VisitNowButtons,
  VisitToggleRow,
} from "@/entities/schedule-item";

import { StopDetail } from "./stop-detail";
import { HereChip, RatingRow, RecordNote, type StopVisit } from "./stop-record";
import { StopSubLine } from "./stop-sub-line";

export type { StopVisit } from "./stop-record";

type LatLng = { lat: number; lng: number };

/** 구간 선 — 패스한 역에 닿으면 회색 파선, 아니면 수단 · tone 의 선 */
function lineOf(mode: RouteMode, tone: RouteTone, pass: boolean): RouteLine {
  return pass ? PASS_LINE : routeLineStyle(mode, tone);
}

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
  /** 방문 모양 — 표식 · 카드 · 구간 선, 토글 · 기록 */
  visit: StopVisit;
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
 * 지도 핀이 있는 역에는 `data-focus-id` 를 단다(PC 스크롤 강조가 기준선을 지난 역을 찾는다).
 * 펼친 카드 맨 아래에 방문 토글(계획 · 기록 같다). 패스한 곳은 접힌 회색 한 줄이고 누르면 원래 카드로 펼친다.
 * 기록 모드는 표식 · 선 · 카드를 다녀감으로 칠하고, 표시 없는 첫 장소는 펼치지 않고 큰 「패스」 · 「✓ 다녀왔어요」 를 둔다
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
  visit,
  checklist,
  vouchers,
  onOpenDetail,
  onAddMemo,
  onShowMap,
  onOpenNote,
  onEditMove,
}: RouteStopItemProps) {
  const { row, seg } = stop;
  const { tone } = visit;
  // 지금 여기 카드는 큰 버튼이 있어 펼치지 않는다
  const expandable = !visit.onNow;
  return (
    <li id={`item-${row.item.id}`} data-focus-id={row.num !== null ? row.item.id : undefined}>
      <RouteStop
        time={row.time}
        name={itemName(row.item)}
        emoji={row.kind === "flight" ? "✈️" : row.emoji}
        aside={tone === "current" && <HereChip />}
        sub={<StopSubLine row={row} tone={tone} dim={visit.dim} markedAt={visit.markedAt} />}
        kind={stop.kind}
        tone={tone}
        category={row.category}
        inLine={inSeg && lineOf(inSeg.mode, visit.inTone, visit.inPass)}
        outLine={seg && lineOf(seg.mode, visit.outTone, visit.outPass)}
        selected={open}
        hovered={focused}
        pinNo={showPin ? row.num : null}
        onClick={expandable ? onToggle : undefined}
        onHover={onHover}
        expandable={expandable}
        slim={tone === "pass" && !open}
        dim={visit.dim && !open}
        record={visit.record}
      >
        <StopInside
          visit={visit}
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
      <NextSegment
        stop={stop}
        tone={visit.outTone}
        pass={visit.outPass}
        onEditMove={onEditMove}
        highlight={segHighlight}
        onHover={onSegHover}
      />
    </li>
  );
}

type StopInsideProps = Pick<
  RouteStopItemProps,
  | "visit"
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
 * 카드 안 아래 칸 — 기록 모드는 다녀온 장소의 별점 줄 · 기록 · 지금 여기의 큰 버튼, 계획 모드는 날짜 메모 · 휴무(늘) · 펼친 칸.
 * 펼쳤으면 맨 아래에 방문 토글. 그릴 것이 없으면 null(RouteStop 이 빈 칸을 숨긴다)
 */
function StopInside({ visit, ...detail }: StopInsideProps) {
  const { stop, open } = detail;
  const toggle = open && visit.toggle && <VisitToggleRow {...visit.toggle} />;
  if (visit.record) {
    return (
      <>
        {visit.rating && <RatingRow {...visit.rating} />}
        {visit.note && <RecordNote {...visit.note} />}
        {visit.onNow && <VisitNowButtons onChange={visit.onNow} />}
        {toggle}
      </>
    );
  }
  if (!open && stop.notes.length === 0 && !stop.row.hoursOff) return null;
  return (
    <>
      <StopDetail {...detail} />
      {toggle}
    </>
  );
}

type NextSegmentProps = Pick<RouteStopItemProps, "stop" | "onEditMove"> & {
  tone: RouteTone;
  /** 패스한 역에 닿는 구간 — 선을 회색 파선으로 */
  pass: boolean;
  highlight: boolean;
  onHover?: (hovering: boolean) => void;
};

/** 다음 역까지의 구간 한 줄. 마지막 역은 없다. 글자를 누르면 이동 방법 창(적을 수 있는 쌍만) */
function NextSegment({ stop, tone, pass, onEditMove, highlight, onHover }: NextSegmentProps) {
  const { row, seg, next } = stop;
  if (!seg || !next) return null;
  const editMove = stop.editable && onEditMove ? () => onEditMove(next) : undefined;
  return (
    <RouteSegmentRow
      tone={tone}
      line={lineOf(seg.mode, tone, pass)}
      icon={seg.icon}
      label={segmentLabel(seg)}
      meta={segmentMeta(seg)}
      highlight={highlight}
      onHover={onHover}
      onClick={editMove}
      ariaLabel={`${itemName(row.item)} → ${itemName(next.item)} 이동 방법`}
    />
  );
}
