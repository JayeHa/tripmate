"use client";

import { useMemo, useRef, useState } from "react";

import { buildRouteDay, RouteMap, routeMapOf, type TimelineRow } from "@/entities/schedule-item";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { useFlightTimes } from "../../model/use-flight-times";
import { MapCards } from "./map-cards";
import { MapTopBar } from "./map-top-bar";

/** 지도로 볼 날과 고른 장소 */
export type RouteMapTarget = { day: number; focusId: string | null };

/** 지도를 덮는 칸 — 위 ‹ · 제목 · 칩 줄 · 범례(약 140), 아래 카드 시트(300), 양옆 16 */
const INSET = { top: 150, bottom: 300, side: 16 };

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

/** 창 안 — 보는 날과 고른 장소를 쥔다. 날을 바꾸면 그날 첫 장소를 고른다 */
function RouteMapBody({
  target,
  startDate,
  totalDays,
  rowsOf,
  tripId,
  onShowInList,
}: RouteMapBodyProps) {
  const flightOf = useFlightTimes(tripId);
  const [day, setDay] = useState(target.day);
  const rows = rowsOf(day);
  const route = useMemo(() => buildRouteDay(rows, flightOf), [rows, flightOf]);
  const data = useMemo(() => routeMapOf(route), [route]);
  const [picked, setPicked] = useState<string | null>(target.focusId);
  const selectedId = data.stops.some((s) => s.row.item.id === picked)
    ? picked
    : (data.stops[0]?.row.item.id ?? null);
  return (
    <>
      <RouteMap data={data} selectedId={selectedId} onSelect={setPicked} inset={INSET} />
      <MapTopBar
        startDate={startDate}
        totalDays={totalDays}
        day={day}
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
      />
    </>
  );
}
