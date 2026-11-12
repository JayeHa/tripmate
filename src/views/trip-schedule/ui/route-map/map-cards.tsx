"use client";

import {
  durationText,
  itemName,
  MapPin,
  type MapRecordTone,
  pinTone,
  type RouteMapRecord,
  type RouteMapStop,
  segmentChip,
  transitRouteUrl,
  type VisitMarks,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { useCardRow } from "../../model/use-card-row";

type MapCardsProps = {
  stops: RouteMapStop[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 그날 대중교통 · 도보 분의 합 */
  totals: { transit: number; walk: number };
  /** 「일정에서 보기」 — 지도를 닫고 노선도에서 그 역을 펼친다 */
  onShowInList: (id: string) => void;
  /** 기록 모드 — 카드 번호를 지도 핀과 같은 다녀감 모양으로 */
  record?: RouteMapRecord;
  /** 다녀감 표시(두 모드) — 패스한 곳의 번호를 진회색으로 */
  marks: VisitMarks;
};

/**
 * 동선 지도 아래 시트 — 머리 「13곳 · 대중교통 0분 · 도보 46분」 + 「5 / 13」, 그 아래 장소 카드를 가로로 넘긴다.
 * 고른 카드가 바뀌면(핀 누르기) 그 카드를 왼쪽 20 에 맞추고, 손으로 넘겨 멈추면 그 카드를 고른다
 */
export function MapCards({
  stops,
  selectedId,
  onSelect,
  totals,
  onShowInList,
  record,
  marks,
}: MapCardsProps) {
  const rowRef = useCardRow(selectedId, onSelect);
  const index = stops.findIndex((s) => s.row.item.id === selectedId);

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex h-75 flex-col rounded-t-[24px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,.12)]">
      <span
        aria-hidden="true"
        className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-line-strong"
      />
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
        <span className="truncate text-[15px] font-extrabold text-ink-900">
          {stops.length}곳 · 대중교통 {durationText(totals.transit)} · 도보{" "}
          {durationText(totals.walk)}
        </span>
        {index >= 0 && (
          <span className="shrink-0 text-[13px] font-bold text-ink-350 tabular-nums">
            {index + 1} / {stops.length}
          </span>
        )}
      </div>
      {stops.length === 0 && (
        <p className="px-5 text-[13px] text-ink-350">지도에 올릴 장소가 없어요</p>
      )}
      <div
        ref={rowRef}
        className="relative flex min-h-0 flex-1 snap-x snap-mandatory scroll-pl-5 gap-2.5 overflow-x-auto px-5 pb-7.5 [&::-webkit-scrollbar]:hidden"
      >
        {stops.map((stop) => (
          <MapCard
            key={stop.row.item.id}
            stop={stop}
            selected={stop.row.item.id === selectedId}
            onSelect={() => onSelect(stop.row.item.id)}
            onShowInList={() => onShowInList(stop.row.item.id)}
            tone={pinTone([stop.row.item.id], record, marks)}
          />
        ))}
      </div>
    </div>
  );
}

type MapCardProps = {
  stop: RouteMapStop;
  selected: boolean;
  onSelect: () => void;
  onShowInList: () => void;
  /** 번호 모양 — 기록 모드 다녀감 · 패스(없으면 예약 상태색) */
  tone: MapRecordTone | null;
};

/** 카드 한 장 — 번호 · 시각 · 들어오는 이동 「← 🚶 도보 3분」(첫 역은 「🏁 출발」) · 이름 2줄 · 설명 · 버튼 둘 */
function MapCard({ stop, selected, onSelect, onShowInList, tone }: MapCardProps) {
  const { row } = stop;
  return (
    <div
      data-card={row.item.id}
      className={cn(
        "flex w-59 shrink-0 snap-start flex-col gap-2 rounded-[16px] bg-white p-3.5",
        selected ? "border-2 border-[#111]" : "border border-[#E8EAED]",
      )}
    >
      {/* 폭을 정해 둔다 — iOS Safari 는 세로 flex 안의 button 을 내용 폭으로 그려 긴 설명이 말줄임 없이 카드 밖으로 넘친다 */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full min-w-0 flex-col gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <MapPin num={stop.num} size="sm" status={row.status} category={null} record={tone} />
          <span className="text-[13px] font-extrabold text-ink-900 tabular-nums">{row.time}</span>
          <span className="ml-auto truncate text-[11px] font-semibold text-ink-350">
            {incomingText(stop)}
          </span>
        </span>
        <span className="line-clamp-2 min-h-10.5 text-base/[1.3] font-extrabold text-[#111]">
          {itemName(row.item)}
        </span>
        <span className="truncate text-xs text-route-sub">{descriptionOf(stop)}</span>
      </button>
      <span className="mt-auto flex gap-1.5">
        <button
          type="button"
          onClick={onShowInList}
          className="flex h-7.5 items-center rounded-full bg-[#111] px-3 text-xs font-bold text-white"
        >
          일정에서 보기
        </button>
        <a
          href={transitRouteUrl(stop.prevAt, stop.at)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7.5 items-center rounded-full bg-surface-muted px-3 text-xs font-bold text-ink-600"
        >
          길찾기
        </a>
      </span>
    </div>
  );
}

/** 「← 🚶 도보 3분」, 그날 첫 역은 「🏁 출발」, 칩이 없는 구간(같은 자리 · 좌표 없음)은 "" */
function incomingText(stop: RouteMapStop): string {
  if (stop.first) return "🏁 출발";
  const chip = stop.inSeg && segmentChip(stop.inSeg);
  return chip ? `← ${chip}` : "";
}

/** 장소 설명, 없으면 일정 설명 */
function descriptionOf(stop: RouteMapStop): string {
  return stop.row.item.place?.description || stop.row.item.description || "";
}
