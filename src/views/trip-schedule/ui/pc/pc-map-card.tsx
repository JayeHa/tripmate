import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import {
  CATEGORY_LABEL,
  itemName,
  MapPin,
  type MapRecordTone,
  PassChip,
  ReservationBadge,
  type ReservationStatus,
  type RouteMapStop,
  type TimelineRow,
  transitRouteUrl,
  VisitedChip,
  type VisitMark,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

type PcMapCardProps = {
  /** 지도에 그린 날의 장소(핀 순서) */
  stops: RouteMapStop[];
  /** 카드에 보일 장소 — stops 안에 있어야 한다 */
  stopId: string;
  /** ‹ › — 그 장소를 고른다(핀을 누른 것과 같다) */
  onPick: (id: string) => void;
  /** 「상세 ›」 */
  onOpenDetail: (row: TimelineRow) => void;
  /** 번호 모양 — 기록 모드는 다녀감, 계획 모드는 패스만. 없으면 예약 상태색 */
  tone?: MapRecordTone | null;
  /** 이 장소의 다녀감 표시 — 있으면 예약 상태 칩 대신 「✓ 다녀옴」 · 「패스」 칩 */
  mark?: VisitMark | null;
  /** 기록 모드에서 지금 여기 장소면 — 「상세 ›」 오른쪽에 「패스」 · 「✓ 다녀왔어요」 */
  onMark?: (mark: VisitMark) => void;
};

/** 기록 모드 번호 36 — 다녀옴 초록 · 지금 여기 진한 초록 · 남음 회색, 모두 흰 숫자 */
const RECORD_NUM = {
  done: "bg-visited",
  current: "bg-visited-text",
  todo: "bg-[#C9CDD2]",
  pass: "bg-pass-strong",
} satisfies Record<MapRecordTone, string>;

/** ‹ › 버튼 — 36×34 · r8 · 1px 회색 테두리, 끝이면 흐리게 */
const STEP =
  "flex h-8.5 w-9 items-center justify-center rounded-button border border-line text-ink-700 disabled:opacity-30";

/**
 * PC 지도 왼쪽 아래 카드(400 · r16). 번호 36(핀 색) · 「day 1 · 2번째 · 12:10」 + 예약 상태 · 이름 · 「카테고리 · 설명」 ·
 * 오른쪽 길찾기(직전 장소 → 이 장소 대중교통). 아래 줄 ‹ 「2 / 8」 › 로 그날 앞뒤 장소를 고르고, 「상세 ›」 로 일정 상세.
 * 기록 모드는 번호를 다녀감 색으로 칠하고, 지금 여기 장소면 「상세 ›」 오른쪽에 「패스」 · 「✓ 다녀왔어요」(상세는 남긴다 — 기록 모드 PC 는 상세를 여기서만 연다).
 * 칩은 다녀감 표시가 먼저 — 「✓ 다녀옴」 · 「패스」, 없으면 예약 상태(계획 · 기록 모드 같다)
 */
export function PcMapCard({
  stops,
  stopId,
  onPick,
  onOpenDetail,
  tone = null,
  mark = null,
  onMark,
}: PcMapCardProps) {
  const index = stops.findIndex((s) => s.row.item.id === stopId);
  const stop = stops[index];
  if (!stop) return null;
  const { row } = stop;
  const name = itemName(row.item);
  return (
    <div className="absolute bottom-5 left-5 z-10 flex w-100 max-w-[calc(100%-40px)] flex-col gap-3 rounded-[16px] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,.16)]">
      <div className="flex items-start gap-3">
        <span className="shrink-0">
          {tone ? (
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-[15px] font-extrabold text-white",
                RECORD_NUM[tone],
              )}
            >
              {stop.num}
            </span>
          ) : (
            <MapPin num={stop.num} size="xl" status={row.status} category={null} />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-xs font-extrabold text-route-stop tabular-nums">
              {headLine(stop)}
            </span>
            <StatusChip mark={mark} status={row.status} />
          </span>
          <span className="truncate text-[17px] font-extrabold text-[#111]">{name}</span>
          <span className="truncate text-[13px] text-ink-500 empty:hidden">{metaLine(row)}</span>
        </div>
        <a
          href={transitRouteUrl(stop.prevAt, stop.at)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} 길찾기`}
          title="구글맵 길찾기"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-route-stop"
        >
          <ArrowUpRight className="size-4.5" strokeWidth={2.2} aria-hidden="true" />
        </a>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="앞 장소"
          disabled={index === 0}
          onClick={() => onPick(stops[index - 1].row.item.id)}
          className={STEP}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="min-w-11 text-center text-[13px] font-bold text-ink-400 tabular-nums">
          {index + 1} / {stops.length}
        </span>
        <button
          type="button"
          aria-label="다음 장소"
          disabled={index === stops.length - 1}
          onClick={() => onPick(stops[index + 1].row.item.id)}
          className={STEP}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail(row)}
          className="ml-auto flex h-8.5 items-center rounded-button border border-line px-3 text-[13px] font-bold text-ink-900"
        >
          상세 ›
        </button>
        {onMark && (
          <>
            <button
              type="button"
              onClick={() => onMark("skipped")}
              className="flex h-8.5 items-center rounded-button bg-surface-muted px-3 text-[13px] font-bold text-ink-700"
            >
              패스
            </button>
            <button
              type="button"
              onClick={() => onMark("visited")}
              className="flex h-8.5 items-center rounded-button bg-visited px-3 text-[13px] font-extrabold text-white"
            >
              ✓ 다녀왔어요
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type StatusChipProps = { mark: VisitMark | null; status: ReservationStatus | null };

/** 머리 줄 칩 — 다녀감 표시가 있으면 그것(「✓ 다녀옴」 · 「패스」), 없으면 예약 상태. 둘 다 없으면 없다 */
function StatusChip({ mark, status }: StatusChipProps) {
  if (mark === "visited") return <VisitedChip />;
  if (mark === "skipped") return <PassChip />;
  return status && <ReservationBadge status={status} className="shrink-0" />;
}

/** 「day 1 · 2번째 · 12:10」 — 시각이 없으면 뺀다 */
function headLine(stop: RouteMapStop): string {
  const { row } = stop;
  return [`day ${row.item.day_index + 1}`, `${stop.num}번째`, row.time].filter(Boolean).join(" · ");
}

/** 「숙소 · 설명」 — 항공편은 「항공 · 제주항공 · 7C1181」. 둘 다 없으면 "" */
function metaLine(row: TimelineRow): string {
  const label = row.kind === "flight" ? "항공" : row.category && CATEGORY_LABEL[row.category];
  const text = row.item.place?.description || row.item.description;
  return [label, text].filter(Boolean).join(" · ");
}
