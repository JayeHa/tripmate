"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { ScheduleItem } from "@/entities/schedule-item";
import { dayLabel, dayParts } from "@/shared/lib/days";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { FilterSelect } from "@/shared/ui/filter-select";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { useDayMemo } from "../model/use-day-memo";
import { useNoteEdit } from "../model/use-note-edit";
import { DeleteMemoButton } from "./delete-memo-button";
import { MemoFields } from "./memo-fields";

type NewMemoDialogProps = {
  tripId: string;
  startDate: string;
  totalDays: number;
  /** 처음 고른 날(보고 있던 날) */
  dayIndex: number;
  onClose: () => void;
};

/**
 * 새 날짜 메모 — 머리 「새 메모」 + 「day 3 · 11.2 (월) 변경 ⌄ · 시간이 없으면 맨 아래에 놓여요」.
 * 저장하면 시간이 없으면 그날 맨 아래, 있으면 그 시각 자리에 메모 카드가 생긴다
 */
export function NewMemoDialog(props: NewMemoDialogProps) {
  const [locked, setLocked] = useState(false);
  const [day, setDay] = useState(props.dayIndex);
  return (
    <SheetDialog
      open
      onClose={props.onClose}
      title="새 메모"
      description={<DayPicker {...props} day={day} onChange={setDay} />}
      locked={locked}
    >
      <NewMemoBody {...props} day={day} onLockChange={setLocked} />
    </SheetDialog>
  );
}

type DayPickerProps = Pick<NewMemoDialogProps, "startDate" | "totalDays"> & {
  day: number;
  onChange: (day: number) => void;
};

/** 머리 아래 날짜 줄 — 「day 3 · 11.2 (월)」 + 「변경 ⌄」(위에 뜨는 목록이라 창 높이가 바뀌지 않는다) */
function DayPicker({ startDate, totalDays, day, onChange }: DayPickerProps) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <span>
        day {day + 1} · {dayLabel(startDate, day)}
      </span>
      <FilterSelect
        layout="dropdown"
        label="날짜 변경"
        align="start"
        allLabel={null}
        value={String(day)}
        onChange={(v) => onChange(Number(v))}
        options={Array.from({ length: totalDays }, (_, d) => {
          const { date, dow } = dayParts(startDate, d);
          return { value: String(d), label: `day ${d + 1}`, sub: `${date}/${dow}` };
        })}
        trigger={
          <button type="button" className="flex items-center font-bold text-primary">
            변경
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </button>
        }
      />
      <span>· 시간이 없으면 맨 아래에 놓여요</span>
    </span>
  );
}

type NewMemoBodyProps = NewMemoDialogProps & {
  day: number;
  onLockChange: (locked: boolean) => void;
};

/** 새 메모 칸 · 취소 | 저장. 상태는 useDayMemo */
function NewMemoBody({ tripId, day, onClose, onLockChange }: NewMemoBodyProps) {
  const form = useDayMemo(tripId, day, onClose);
  useReportLock(form.locked, onLockChange);
  return (
    <div className="flex flex-col gap-4">
      <MemoFields
        tripId={tripId}
        draft={form.draft}
        set={form.set}
        pinReady={form.pinReady}
        disabled={form.uploading}
        error={form.error}
      />
      <MemoFooter
        locked={form.locked}
        canSave={form.canSave && !form.pending}
        uploading={form.uploading}
        onCancel={onClose}
        onSave={form.save}
      />
    </div>
  );
}

type EditMemoDialogProps = {
  tripId: string;
  startDate: string;
  item: ScheduleItem;
  onClose: () => void;
};

/** 날짜 메모 고치기 — 머리 「메모」 + 「day 3 · 11.2 (월)」, 아래 왼쪽 「삭제」. 메모 카드를 누르면 연다 */
export function EditMemoDialog(props: EditMemoDialogProps) {
  const [locked, setLocked] = useState(false);
  const { item, startDate } = props;
  return (
    <SheetDialog
      open
      onClose={props.onClose}
      title="메모"
      description={`day ${item.day_index + 1} · ${dayLabel(startDate, item.day_index)}`}
      locked={locked}
    >
      <EditMemoBody {...props} onLockChange={setLocked} />
    </SheetDialog>
  );
}

type EditMemoBodyProps = EditMemoDialogProps & { onLockChange: (locked: boolean) => void };

/** 고치기 칸 · 삭제 · 취소 | 저장. 상태는 useNoteEdit */
function EditMemoBody({ tripId, item, onClose, onLockChange }: EditMemoBodyProps) {
  const form = useNoteEdit(tripId, item, onClose);
  useReportLock(form.locked, onLockChange);
  return (
    <div className="flex flex-col gap-4">
      <MemoFields
        tripId={tripId}
        draft={form.draft}
        set={form.set}
        pinReady={form.pinReady}
        disabled={form.uploading}
        error={form.error}
      />
      <MemoFooter
        locked={form.locked}
        canSave={form.canSave && !form.pending}
        uploading={form.uploading}
        onCancel={onClose}
        onSave={form.save}
      >
        <DeleteMemoButton disabled={form.pending} onConfirm={form.destroy} />
      </MemoFooter>
    </div>
  );
}

type MemoFooterProps = {
  locked: boolean;
  canSave: boolean;
  /** 사진을 올리는 중 — 저장 버튼에 「올리는 중…」 */
  uploading: boolean;
  onCancel: () => void;
  onSave: () => void;
  /** 왼쪽 끝(고치기의 「삭제」) */
  children?: React.ReactNode;
};

/** 아래 버튼 줄 — (삭제) · 취소(90, PC 120) | 저장(130, PC 180, 빈 글이면 막힘) */
function MemoFooter({ locked, canSave, uploading, onCancel, onSave, children }: MemoFooterProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <Button
        variant="chip"
        size="form"
        className="ml-auto w-22.5 lg:w-30"
        disabled={locked}
        onClick={onCancel}
      >
        취소
      </Button>
      <Button size="form" className="w-32.5 lg:w-45" disabled={!canSave} onClick={onSave}>
        {uploading ? "올리는 중…" : "저장"}
      </Button>
    </div>
  );
}
