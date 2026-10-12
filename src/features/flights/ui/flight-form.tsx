"use client";

import type { ReactNode } from "react";

import { airportName } from "@/entities/flight";
import { ReservationStatusPicker } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { DateField } from "@/shared/ui/date-field";
import { Input } from "@/shared/ui/input";
import { TimeField } from "@/shared/ui/time-field";

import { arrivalDate } from "../lib/flight-form";
import type { FlightFormState } from "../model/use-flight-form";
import { ScheduleNotice } from "./schedule-notice";

type FlightFormProps = {
  form: FlightFormState;
  /** 고치는 중이면 맨 아래 「항공편 삭제」 */
  onDelete: (() => void) | null;
  /** 예약번호 아래 「결제」 칸 — 고치는 항공편은 저장된 결제, 새 항공편은 초안 */
  payment?: ReactNode;
};

/**
 * 항공편 입력 칸들 — 예약 상태 → 출발일 → 항공편명 → 출발 공항 → 출발 시간 → 도착 공항 → 도착일 → 도착 시간 → 예약번호(선택) → 결제.
 * 항공편명 · 공항은 누르면 찾기 화면으로 바뀐다. 도착일은 비어 있으면 출발일을 따라간다
 */
export function FlightForm({ form, onDelete, payment }: FlightFormProps) {
  const { values: v, set } = form;
  const airline = v.airlineCode ? `${v.airlineName}(${v.airlineCode})${v.flightNo}` : "";
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-1 pb-6">
      {form.error && <p className="pt-2 text-[13px] text-destructive">{form.error}</p>}
      <Row label="예약 상태" bold>
        <ReservationStatusPicker value={v.status} onChange={(s) => set("status", s)} />
      </Row>
      <Row label="출발일">
        <DateField
          variant="bare"
          required
          value={v.depDate}
          onChange={(d) => set("depDate", d)}
          aria-label="출발일"
        />
      </Row>
      <Row label="항공편명">
        <PickText
          text={airline}
          placeholder="항공편명을 입력해주세요."
          onClick={form.openAirline}
        />
      </Row>
      <Row label="출발 공항">
        <PickText
          text={airportText(v.depAirport)}
          placeholder="공항을 검색해주세요."
          onClick={() => form.openAirport("dep")}
        />
      </Row>
      <Row label="출발 시간">
        <div className="max-w-50">
          <TimeField value={v.depTime} onChange={(t) => set("depTime", t)} aria-label="출발 시간" />
        </div>
      </Row>
      <Row label="도착 공항">
        <PickText
          text={airportText(v.arrAirport)}
          placeholder="공항을 검색해주세요."
          onClick={() => form.openAirport("arr")}
        />
      </Row>
      <Row label="도착일">
        <DateField
          variant="bare"
          required
          min={v.depDate}
          value={arrivalDate(v)}
          onChange={(d) => set("arrDate", d)}
          aria-label="도착일"
        />
      </Row>
      <Row label="도착 시간">
        <div className="max-w-50">
          <TimeField value={v.arrTime} onChange={(t) => set("arrTime", t)} aria-label="도착 시간" />
        </div>
      </Row>
      <Row label="예약번호 (선택)">
        <Input
          value={v.bookingRef}
          onChange={(e) => set("bookingRef", e.target.value)}
          maxLength={50}
          placeholder="예) ABC123"
          aria-label="예약번호"
        />
      </Row>
      {payment && <div className="pt-4">{payment}</div>}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="mt-6 flex h-12 shrink-0 items-center justify-center rounded-button bg-destructive-soft text-[15px] font-semibold text-destructive"
        >
          항공편 삭제
        </button>
      )}
      <div className="pt-4">
        <ScheduleNotice />
      </div>
    </div>
  );
}

/** 공항 칸 글자 「NRT · 나리타국제공항」. 고르기 전에는 "" */
function airportText(code: string): string {
  if (!code) return "";
  const name = airportName(code);
  return name === code ? code : `${code} · ${name}`;
}

type RowProps = { label: string; bold?: boolean; children: ReactNode };

/** 폼 한 줄 — 위 이름 13(#999, 예약 상태만 굵게 #444) + 값, 아래 구분선 */
function Row({ label, bold = false, children }: RowProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-divider pt-4.5 pb-4">
      <span className={cn("text-[13px]", bold ? "font-bold text-ink-700" : "text-ink-400")}>
        {label}
      </span>
      {children}
    </div>
  );
}

type PickTextProps = { text: string; placeholder: string; onClick: () => void };

/** 누르면 찾기 화면을 여는 글자 칸 — 값 17/700, 비면 회색 안내 */
function PickText({ text, placeholder, onClick }: PickTextProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "truncate text-left text-[17px] font-bold",
        text ? "text-ink-900" : "text-line-dashed",
      )}
    >
      {text || placeholder}
    </button>
  );
}
