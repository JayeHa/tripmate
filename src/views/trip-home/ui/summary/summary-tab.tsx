"use client";

import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Segmented } from "@/shared/ui/segmented";
import { Toast, type ToastMessage } from "@/shared/ui/toast";
import { VoucherDetailOverlay } from "@/widgets/trip-voucher";

import type { Peek } from "../../lib/peek";
import { type Phase, PHASE_LABEL, phaseNote, PHASES, tripPhase } from "../../lib/phase";
import { boardDayIndex } from "../../lib/today-plan";
import { useWidgets } from "../../model/use-widgets";
import { PeekDialog } from "./peek-dialog";
import { PhaseBoard } from "./phase-board";
import { RateCalculator } from "./rate-calculator";
import { WeatherSheet } from "./weather-sheet";
import { WidgetRow } from "./widget-row";

const PHASE_OPTIONS = PHASES.map((p) => ({ value: p, label: PHASE_LABEL[p] }));

type SummaryTabProps = { tripId: string; trip: Trip; layout: "mobile" | "pc" };

/**
 * 「요약」 탭 — 위 세그먼트(여행 전 · 중 · 후, 날짜로 자동 선택 · 다른 시점은 미리보기) + 현지 정보 위젯 줄 + 그 시점의 상태판.
 * 위젯 줄은 여행 후에는 숨긴다(현지 날씨 · 환율 · 시간이 더 필요 없다). 환율 타일을 누르면 계산기, 날씨 타일은 여행 기간 날씨, 상태판 줄을 누르면 미리 보기.
 * 고른 시점은 이 화면에서만 기억한다(다시 열면 날짜로 정한 시점). 여행 홈의 토스트는 이 탭이 하나를 그린다.
 * 모바일 「오늘 쓸 바우처」 줄은 홈 위에 그 바우처 상세를 연다(VoucherDetailOverlay)
 */
export function SummaryTab({ tripId, trip, layout }: SummaryTabProps) {
  const today = todayISO();
  const [picked, setPicked] = useState<Phase | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [voucherId, setVoucherId] = useState<string | null>(null);
  const showToast = (text: string) => setToast({ text, id: Date.now() });
  const auto = tripPhase(trip.start_date, trip.end_date, today);
  const phase = picked ?? auto;
  const widgets = useWidgets(tripId, trip);
  const showWidgets = phase !== "post" && widgets !== null && widgets.tiles.length > 0;
  return (
    <div className={cn("flex flex-col pb-6", layout === "pc" && "mx-auto w-full max-w-270")}>
      <div className={cn("flex items-center gap-2", layout === "pc" ? "px-10 pt-5" : "px-5 pt-3")}>
        <Segmented
          options={PHASE_OPTIONS}
          value={phase}
          onChange={setPicked}
          aria-label="상태판 시점"
        />
        <span className="truncate text-xs text-ink-350">
          {phaseNote(phase, trip.start_date, trip.end_date, today)}
        </span>
      </div>
      {showWidgets ? (
        <WidgetRow
          tiles={widgets.tiles}
          layout={layout}
          onOpenRate={() => setCalcOpen(true)}
          onOpenWeather={() => setWeatherOpen(true)}
          outfit={widgets.outfit}
          credits={{
            weather: widgets.weather,
            rate: widgets.live !== null,
            holiday: widgets.holiday,
          }}
        />
      ) : (
        <div className="h-3" />
      )}
      <PhaseBoard
        tripId={tripId}
        trip={trip}
        phase={phase}
        layout={layout}
        onToast={(m) => setToast({ ...m, id: Date.now() })}
        onPeek={setPeek}
        onOpenVoucher={setVoucherId}
      />
      <PeekDialog peek={peek} onClose={() => setPeek(null)} />
      <WeatherSheet
        open={weatherOpen}
        onClose={() => setWeatherOpen(false)}
        tripId={tripId}
        trip={trip}
      />
      <VoucherDetailOverlay
        tripId={tripId}
        voucherId={voucherId}
        onClose={() => setVoucherId(null)}
        onToast={showToast}
      />
      {widgets && (
        <RateCalculator
          open={calcOpen}
          onClose={() => setCalcOpen(false)}
          tripId={tripId}
          local={widgets.currency}
          home={trip.home_currency}
          rates={trip.exchange_rates}
          period={auto === "now" ? boardDayIndex(trip.start_date, trip.end_date, today) : null}
          live={widgets.live}
        />
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
