"use client";

import { format, parseISO } from "date-fns";

import { itemName, type TimelineRow } from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";

import type { ScheduleRecord } from "../../model/use-schedule-record";
import { RecordDialog, type RecordTarget } from "./record-dialog";

type RecordOverlayProps = {
  startDate: string;
  /** 모든 날짜의 줄 — 기록 창을 연 일정을 찾는다 */
  rows: readonly TimelineRow[];
  record: ScheduleRecord;
};

/**
 * 일정 화면의 기록 창 — 카드의 「+ 기록 · 사진 남기기」 · 「✎ 기록 수정」 이 연다.
 * 저장하면 바뀐 별점 · 글만 올린다(둘 다 오프라인 대기열). 연 일정을 일행이 지우면 창이 닫힌다
 */
export function RecordOverlay({ startDate, rows, record }: RecordOverlayProps) {
  const row = rows.find((r) => r.item.id === record.writing) ?? null;
  const target: RecordTarget | null = row && {
    itemId: row.item.id,
    caption: captionOf(row, startDate, record.markedAt(row.item.id)),
    stars: record.stars[row.item.id] ?? 0,
    body: record.notes[row.item.id] ?? "",
  };
  return (
    <RecordDialog
      target={target}
      onClose={record.closeWrite}
      onSave={(itemId, draft) => {
        if (draft.stars !== (record.stars[itemId] ?? 0)) record.rate(itemId, draft.stars);
        record.saveNote(itemId, draft.body);
      }}
    />
  );
}

/** 머리 둘째 줄 — 「🍜 이치란 · 11.2 (월) 10:52 도착」. 도착 시각을 모르면 날짜까지 */
function captionOf(row: TimelineRow, startDate: string, markedAt: string | null): string {
  const name = [row.emoji, itemName(row.item)].filter(Boolean).join(" ");
  const day = dayLabel(startDate, row.item.day_index);
  return markedAt
    ? `${name} · ${day} ${format(parseISO(markedAt), "HH:mm")} 도착`
    : `${name} · ${day}`;
}
