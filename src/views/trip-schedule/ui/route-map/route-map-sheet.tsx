"use client";

import { useMemo, useRef, useState } from "react";

import {
  buildRouteDay,
  type DayMode,
  defaultStopId,
  RouteMap,
  routeMapOf,
  type TimelineRow,
} from "@/entities/schedule-item";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { useElementHeight } from "@/shared/lib/use-element-height";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { nextStopId, recordOfRoute, routeMapRecord } from "../../lib/record";
import { useFlightTimes } from "../../model/use-flight-times";
import type { ScheduleRecord } from "../../model/use-schedule-record";
import { MapCards } from "./map-cards";
import { MapTopBar } from "./map-top-bar";

/** 지도로 볼 날과 고른 장소 */
export type RouteMapTarget = { day: number; focusId: string | null };

/** 아래 카드 시트 높이 */
const SHEET_HEIGHT = 300;
/** 지도 양옆 여백 */
const SIDE = 16;
/** 위 칸(‹ · 제목 · 칩 줄 · 범례)을 재기 전의 높이 — 안전 영역이 없는 화면의 값 */
const TOP_BAR_FALLBACK = 140;
/** 위 칸 아래에 더 비우는 거리 — 범위 밖 핀 · 이름표가 범례에 붙지 않게 */
const TOP_GAP = 8;

type RouteMapSheetProps = {
  /** 열린 날. null 이면 닫혀 있다 */
  target: RouteMapTarget | null;
  onClose: () => void;
  startDate: string;
  totalDays: number;
  /** 그 날의 타임라인 줄 */
  rowsOf: (day: number) => TimelineRow[];
  /** 항공편 카드의 편명 시각을 읽을 여행 */
  tripId: string;
  /** 「일정에서 보기」 — 창이 다 닫힌 뒤에 부른다(닫히며 포커스가 돌아가 스크롤이 움직인 뒤에 옮기게) */
  onShowInList: (id: string) => void;
  /** 기록 모드로 열면 핀 · 선 · 카드 번호를 다녀감으로 칠한다 */
  mode: DayMode;
  record: ScheduleRecord;
};

/**
 * 모바일 동선 지도 — 일정 위에 전체 화면으로 연다(상단바 「🗺 동선 보기」 · 역 펼침 「🗺 지도에서」).
 * 지도 위에 ‹ · 제목 · 날짜 칩 · 범례, 아래 카드 시트. 핀 ↔ 카드가 같은 장소를 고른다.
 * 열 때마다 새로 그린다(지난 날 · 고른 장소가 남지 않게)
 */
export function RouteMapSheet({ target, onClose, onShowInList, ...rest }: RouteMapSheetProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const openCount = useOpenCount(open);
  const pending = useRef<string | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      onOpenChangeComplete={(next) => {
        if (next || !pending.current) return;
        onShowInList(pending.current);
        pending.current = null;
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="inset-0 block h-dvh w-full max-w-none translate-0 overflow-hidden rounded-none p-0 sm:max-w-none"
      >
        {shown && (
          <RouteMapBody
            key={openCount}
            target={shown}
            onShowInList={(id) => {
              pending.current = id;
              onClose();
            }}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type RouteMapBodyProps = Omit<RouteMapSheetProps, "target" | "onClose"> & {
  target: RouteMapTarget;
};

/**
 * 창 안 — 보는 날과 고른 장소를 쥔다. 고른 장소가 없으면(날을 바꾸면) 기록 모드는 「✓ 다녀왔어요」 를 둘 장소,
 * 그것도 없으면 그날 범위 안의 첫 장소
 */
function RouteMapBody({
  target,
  startDate,
  totalDays,
  rowsOf,
  tripId,
  onShowInList,
  mode,
  record,
}: RouteMapBodyProps) {
  const flightOf = useFlightTimes(tripId);
  const [day, setDay] = useState(target.day);
  const rows = rowsOf(day);
  const route = useMemo(() => buildRouteDay(rows, flightOf), [rows, flightOf]);
  const data = useMemo(() => routeMapOf(route), [route]);
  const [picked, setPicked] = useState<string | null>(target.focusId);
  // 위 칸은 안전 영역(노치)만큼 기기마다 높이가 달라 실제 높이를 잰다
  const barRef = useRef<HTMLDivElement>(null);
  const barHeight = useElementHeight(barRef);
  const inset = useMemo(
    () => ({ top: (barHeight || TOP_BAR_FALLBACK) + TOP_GAP, bottom: SHEET_HEIGHT, side: SIDE }),
    [barHeight],
  );
  const tones = mode === "record" ? recordOfRoute(route, record.marks, record.dayOf(day)) : null;
  const mapRecord = tones ? routeMapRecord(route, tones) : undefined;
  const onMap = (id: string | null) => data.stops.some((s) => s.row.item.id === id);
  const selectedId =
    [picked, tones ? nextStopId(route, tones) : null].find(onMap) ?? defaultStopId(data);
  return (
    <>
      <RouteMap
        data={data}
        selectedId={selectedId}
        onSelect={setPicked}
        inset={inset}
        record={mapRecord}
        marks={record.marks}
      />
      <MapTopBar
        ref={barRef}
        startDate={startDate}
        totalDays={totalDays}
        day={day}
        record={mode === "record"}
        onDayChange={(d) => {
          setDay(d);
          setPicked(null);
        }}
      />
      <MapCards
        stops={data.stops}
        selectedId={selectedId}
        onSelect={setPicked}
        totals={route.totals}
        onShowInList={onShowInList}
        record={mapRecord}
        marks={record.marks}
      />
    </>
  );
}
