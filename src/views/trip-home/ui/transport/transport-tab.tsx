"use client";

import { Pencil, Plus } from "lucide-react";

import type { Trip } from "@/entities/trip";
import { dayLabel } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";

import { useTransportTab } from "../../model/use-transport-tab";
import { BoardCard } from "../summary/board-card";
import { BoardSkeleton } from "../summary/board-grid";
import { FareDialog } from "./fare-dialog";
import { DayFares, ExtraFares } from "./fare-rows";
import { NoteDialog } from "./note-dialog";

type TransportTabProps = { tripId: string; trip: Trip; layout: "mobile" | "pc" };

/**
 * 「교통」 탭 — 여행 전에 적어 두는 1인 예상 교통비(일행 공유).
 * 1인 합계 · 교통카드 · 패스 메모 · 날짜별 줄(기간의 모든 날) · 그 밖의 교통비(공항 왕복 · 패스).
 * 모바일은 한 줄로, PC 는 왼쪽 날짜별 · 오른쪽 합계 · 메모 · 그 밖의 교통비
 */
export function TransportTab({ tripId, trip, layout }: TransportTabProps) {
  const t = useTransportTab(tripId, trip);
  if (t.loading) return <BoardSkeleton layout={layout} />;

  const total = (
    <BoardCard key="total" title="1인 예상 교통비" layout={layout}>
      {t.total ? (
        <div className="flex flex-col gap-0.5">
          <p className="text-2xl/tight font-extrabold text-ink-900 tabular-nums">{t.total}</p>
          {t.approx && <p className="text-[13px] text-ink-400 tabular-nums">{t.approx}</p>}
          {t.group && (
            <p className="mt-1 text-[13px] text-ink-500">
              {t.group.people}명이면 <span className="font-bold tabular-nums">{t.group.total}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-[13px] text-ink-400">날짜마다 1인 교통비를 적으면 여기서 더해요</p>
      )}
    </BoardCard>
  );
  const note = (
    <BoardCard key="note" title="교통카드 · 패스" layout={layout}>
      <button
        type="button"
        onClick={() => t.setNoteOpen(true)}
        className="flex items-start gap-2 text-left"
      >
        {trip.transport_note ? (
          <>
            <span className="flex-1 text-sm/relaxed whitespace-pre-line text-ink-700">
              {trip.transport_note}
            </span>
            <Pencil className="mt-0.5 size-4 shrink-0 text-ink-350" aria-label="고치기" />
          </>
        ) : (
          <span className="flex items-center gap-1 text-[13px] font-bold text-brand-text">
            <Plus className="size-3.5" aria-hidden />
            어떤 교통카드 · 패스를 쓰는지 적어 두세요
          </span>
        )}
      </button>
    </BoardCard>
  );
  const days = (
    <BoardCard key="days" title="날짜별" count={`${t.totalDays}일`} layout={layout}>
      <DayFares
        fares={t.fares}
        startDate={trip.start_date}
        totalDays={t.totalDays}
        onEdit={t.setEditing}
      />
    </BoardCard>
  );
  const extras = (
    <BoardCard key="extras" title="그 밖의 교통비" layout={layout}>
      <ExtraFares fares={t.fares} onEdit={t.setEditing} />
    </BoardCard>
  );

  return (
    <div className={cn("flex flex-col pb-6", layout === "pc" && "mx-auto w-full max-w-270")}>
      {layout === "pc" ? (
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-5 px-10 pt-5">
          <div className="flex min-w-0 flex-col gap-4">{days}</div>
          <div className="flex min-w-0 flex-col gap-4">{[total, note, extras]}</div>
        </div>
      ) : (
        <div className="flex flex-col pt-3">{[total, note, days, extras]}</div>
      )}
      <FareDialog
        tripId={tripId}
        target={t.editing}
        dayTitle={(i) => `day ${i + 1} · ${dayLabel(trip.start_date, i)}`}
        currencies={t.currencies}
        startCurrency={t.startCurrency}
        onClose={() => t.setEditing(null)}
      />
      <NoteDialog
        tripId={tripId}
        open={t.noteOpen}
        note={trip.transport_note}
        onClose={() => t.setNoteOpen(false)}
      />
    </div>
  );
}
