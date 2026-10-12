"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { ReservationStatusPicker } from "@/entities/schedule-item";
import { nightsOf } from "@/entities/stay";
import { cn } from "@/shared/lib/utils";
import { EmojiField } from "@/shared/ui/emoji-field";
import { Input } from "@/shared/ui/input";
import { LinkRows } from "@/shared/ui/link-rows";
import { Textarea } from "@/shared/ui/textarea";
import { TimeField } from "@/shared/ui/time-field";

import { STAY_DEFAULT_EMOJI } from "../lib/stay-form";
import type { StayFormState } from "../model/use-stay-form";
import { AddressField } from "./address-field";

type StayFormProps = {
  form: StayFormState;
  /** 체크인/체크아웃 시간 아래 「결제」 칸 — 고칠 때만(새 숙소는 아직 붙일 숙소가 없다) */
  payment?: ReactNode;
  /** 고치는 중이면 맨 아래 「숙소 삭제」 */
  onDelete: (() => void) | null;
};

/**
 * 숙소 입력 칸들 — 예약 상태 → 주소 → 아이콘 · 이름 → 숙박 날짜 → 체크인/체크아웃 시간 → 결제(요약) → 메모 → 링크
 */
export function StayForm({ form, payment, onDelete }: StayFormProps) {
  const { values: v, set } = form;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-7">
      {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
      <Field label="예약 상태">
        <ReservationStatusPicker value={v.status} onChange={(s) => set("status", s)} />
      </Field>
      <Field label="주소">
        <AddressField location={v.location} onClick={form.pickLocation} />
      </Field>
      <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-2.5">
        <Field label="아이콘">
          <EmojiField
            value={v.emoji}
            onChange={(e) => set("emoji", e)}
            defaultEmoji={STAY_DEFAULT_EMOJI}
          />
        </Field>
        <Field label="숙소 이름">
          <Input
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="예) 에어비앤비 Grace 东京雅栈"
            maxLength={100}
            className="font-bold"
          />
        </Field>
      </div>
      <Field label="숙박 날짜">
        <DatesButton checkIn={v.checkIn} checkOut={v.checkOut} onClick={form.openDates} />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="체크인 시간">
          <TimeField value={v.inTime} onChange={(t) => set("inTime", t)} aria-label="체크인 시간" />
        </Field>
        <Field label="체크아웃 시간">
          <TimeField
            value={v.outTime}
            onChange={(t) => set("outTime", t)}
            aria-label="체크아웃 시간"
          />
        </Field>
      </div>
      {payment}
      <Field
        label={
          <>
            메모 <span className="font-medium text-ink-350">(선택)</span>
          </>
        }
      >
        <Textarea
          value={v.memo}
          onChange={(e) => set("memo", e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="체크인/체크아웃 메모, 취소/환불 규정, 확인번호, 연락처, 객실 정보 등을 자유롭게 입력하세요"
          className="text-sm/[1.55]"
        />
      </Field>
      <Field label="링크">
        <LinkRows
          label="숙소 링크"
          titlePlaceholder="링크 제목 (예: 체크인 가이드)"
          links={v.links}
          onChange={(links) => set("links", links)}
        />
      </Field>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="mt-2 self-center text-sm font-bold text-destructive"
        >
          숙소 삭제
        </button>
      )}
    </div>
  );
}

type FieldProps = { label: ReactNode; children: ReactNode };

/** 칸 — 이름 13/700 + 입력 */
function Field({ label, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">{label}</span>
      {children}
    </div>
  );
}

type DatesButtonProps = { checkIn: string | null; checkOut: string | null; onClick: () => void };

/** 날짜를 「11.1(일)」 로 */
function shortDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}.${d.getDate()}(${"일월화수목금토"[d.getDay()]})`;
}

/** 숙박 날짜 칸 56 — 체크인 → 체크아웃 · N박. 누르면 달력 */
function DatesButton({ checkIn, checkOut, onClick }: DatesButtonProps) {
  const picked = !!checkIn && !!checkOut;
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-14 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-memo border border-line px-3.5 text-left hover:bg-surface-sunken"
    >
      <span className="flex flex-col gap-px">
        <span className="text-[11px] text-ink-400">체크인</span>
        <span className={cn("text-[15px] font-bold", checkIn ? "text-ink-900" : "text-ink-350")}>
          {shortDate(checkIn)}
        </span>
      </span>
      <ArrowRight className="size-4 text-ink-350" />
      <span className="flex flex-col gap-px">
        <span className="text-[11px] text-ink-400">체크아웃</span>
        <span className={cn("text-[15px] font-bold", checkOut ? "text-ink-900" : "text-ink-350")}>
          {shortDate(checkOut)}
        </span>
      </span>
      <span className="flex h-6 items-center rounded-full bg-surface-muted px-2.25 text-xs font-extrabold text-ink-700">
        {picked ? `${nightsOf({ check_in_date: checkIn, check_out_date: checkOut })}박` : "—"}
      </span>
    </button>
  );
}
