"use client";

import { format, parseISO } from "date-fns";

import { itemName, type TimelineRow, type VisitPhoto } from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";

import type { ScheduleRecord } from "../../model/use-schedule-record";
import { RecordDialog } from "./record-dialog";
import type { RecordTarget } from "./record-form";
import { RecordView, type RecordViewTarget } from "./record-view";

type RecordOverlayProps = {
  tripId: string;
  startDate: string;
  /** 모든 날짜의 줄 — 기록 창 · 자세히 보기를 연 일정을 찾는다 */
  rows: readonly TimelineRow[];
  record: ScheduleRecord;
};

/**
 * 일정 화면의 기록 창과 기록 자세히 보기.
 * 기록 창은 카드의 「+ 기록 · 사진 남기기」 · 「✎ 기록 수정」 이 연다. 저장하면 바뀐 별점 · 글만 올린다(둘 다 오프라인 대기열 —
 * 사진은 창이 올린다). 글 · 사진은 일행과 함께 쓰는 것이라 창은 열 때 본 값에서 바뀐 것만 저장한다.
 * 자세히 보기는 카드의 사진 · 글이 연다(읽기용). 「수정」 은 보기를 닫고 기록 창을 연다 — 창을 겹치지 않는다.
 * 연 일정을 일행이 지우면 둘 다 닫힌다
 */
export function RecordOverlay({ tripId, startDate, rows, record }: RecordOverlayProps) {
  const writing = rows.find((r) => r.item.id === record.writing);
  const viewing = rows.find((r) => r.item.id === record.viewing);
  return (
    <>
      <RecordView
        tripId={tripId}
        target={viewing ? viewTarget(viewing, startDate, record) : null}
        uploader={record.uploader}
        onClose={record.closeView}
        onEdit={(itemId) => {
          record.closeView();
          record.openWrite(itemId);
        }}
      />
      <RecordDialog
        tripId={tripId}
        target={writing ? writeTarget(writing, startDate, record) : null}
        shared={record.shared}
        uploader={record.uploader}
        onClose={record.closeWrite}
        onSave={(itemId, draft) => {
          if (draft.stars !== (record.stars[itemId] ?? 0)) record.rate(itemId, draft.stars);
          if (draft.note) record.saveNote(itemId, draft.note.body, draft.note.seen);
        }}
      />
    </>
  );
}

const NO_PHOTOS: readonly VisitPhoto[] = [];

/** 기록 창에 넘길 지금 값 — 창은 열 때 한 번만 읽는다 */
function writeTarget(row: TimelineRow, startDate: string, record: ScheduleRecord): RecordTarget {
  const id = row.item.id;
  const note = record.notes[id];
  return {
    itemId: id,
    caption: captionOf(row, startDate, record.markedAt(id)),
    stars: record.stars[id] ?? 0,
    body: note?.body ?? "",
    noteAt: note?.updated_at ?? null,
    photos: record.photos[id] ?? NO_PHOTOS,
  };
}

/**
 * 자세히 보기에 넘길 지금 값. 고친 사람은 글에 남은 id 로 멤버에서 찾는다 —
 * id 가 비었으면(지운 계정) 찾지 않는다. uploader(null) 은 「나」 라서 내 이름이 잘못 붙는다
 */
function viewTarget(row: TimelineRow, startDate: string, record: ScheduleRecord): RecordViewTarget {
  const id = row.item.id;
  const note = record.notes[id];
  const markedAt = record.markedAt(id);
  const day = dayLabel(startDate, row.item.day_index);
  return {
    itemId: id,
    title: nameOf(row),
    sub: markedAt ? `${day} · ${format(parseISO(markedAt), "HH:mm")} 도착` : day,
    board: record.board(id),
    stars: record.stars[id] ?? 0,
    body: note?.body ?? "",
    editor: note?.updated_by ? (record.uploader(note.updated_by)?.name ?? null) : null,
    photos: record.photos[id] ?? NO_PHOTOS,
  };
}

/** 「🍜 이치란」 — 이모지가 없으면 이름만 */
function nameOf(row: TimelineRow): string {
  return [row.emoji, itemName(row.item)].filter(Boolean).join(" ");
}

/** 머리 둘째 줄 — 「🍜 이치란 · 11.2 (월) 10:52 도착」. 도착 시각을 모르면 날짜까지 */
function captionOf(row: TimelineRow, startDate: string, markedAt: string | null): string {
  const name = nameOf(row);
  const day = dayLabel(startDate, row.item.day_index);
  return markedAt
    ? `${name} · ${day} ${format(parseISO(markedAt), "HH:mm")} 도착`
    : `${name} · ${day}`;
}
