import { CircleAlert } from "lucide-react";

import {
  AlternativesLine,
  itemCoords,
  itemName,
  NoteChips,
  type RouteStopData,
  type TimelineRow,
  transitRouteUrl,
} from "@/entities/schedule-item";

type LatLng = { lat: number; lng: number };

type StopDetailProps = {
  stop: RouteStopData;
  /** 펼쳤다 — 메모 · 칩 · 버튼을 보인다. 접어도 노트 · 휴무는 보인다 */
  open: boolean;
  /** 직전 역의 좌표 — 「길찾기」 출발지. 그날 첫 장소면 null(지금 위치에서) */
  prevAt: LatLng | null;
  checklist?: { count: number; href: string };
  vouchers?: { count: number; onOpen: () => void };
  onOpenDetail: () => void;
  /** 「🗺 지도에서」 — 좌표가 있는 장소만 */
  onShowMap: () => void;
  /** 날짜 메모를 눌렀다 — 시간 · 메모 창 */
  onOpenNote: (note: TimelineRow) => void;
};

/**
 * 역 아래 칸. 늘 보이는 것: 이 역 뒤에 둔 날짜 메모(⚠ 주황 상자, 누르면 시간 · 메모 창) · 그날 휴무.
 * 펼치면: 메모 상자(「· 」 줄, ★ 중요는 「★」, 영업하는 날은 「운영 …」) · 체크리스트 · 바우처 칩 · 대체 장소 ·
 * 「상세」 · 「길찾기」(직전 역 → 이 역 대중교통) · 「🗺 지도에서」
 */
export function StopDetail({
  stop,
  open,
  prevAt,
  checklist,
  vouchers,
  onOpenDetail,
  onShowMap,
  onOpenNote,
}: StopDetailProps) {
  const { row, notes } = stop;
  const here = itemCoords(row.item);
  return (
    <>
      {notes.map((note) => (
        <button
          type="button"
          key={note.item.id}
          onClick={() => onOpenNote(note)}
          className="rounded-button bg-route-note-bg px-2.5 py-1.75 text-left text-xs/[1.45] whitespace-pre-line text-route-note"
        >
          ⚠ {itemName(note.item)}
        </button>
      ))}
      {row.hoursOff && (
        <p className="inline-flex h-6 items-center gap-1 self-start rounded-pill-sm bg-destructive-soft px-2 text-xs font-extrabold text-destructive">
          <CircleAlert className="size-3.25" strokeWidth={2.4} aria-hidden="true" />
          {row.hours}
        </p>
      )}
      {open && (
        <>
          <MemoBox row={row} />
          <NoteChips checklist={checklist} vouchers={vouchers} />
          <AlternativesLine alternatives={row.alternatives} />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={onOpenDetail} className={OUTLINE}>
              상세
            </button>
            {here && (
              <a
                href={transitRouteUrl(prevAt, here)}
                target="_blank"
                rel="noopener noreferrer"
                className={OUTLINE}
              >
                길찾기
              </a>
            )}
            {here && (
              <button
                type="button"
                onClick={onShowMap}
                className="flex h-7.5 items-center rounded-full bg-[#111] px-3 text-[13px] font-bold text-white"
              >
                🗺 지도에서
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

/** 펼침 버튼 — 30 · r15 · 1px 회색 테두리 · 13/700 */
const OUTLINE =
  "flex h-7.5 items-center rounded-full border border-line bg-white px-3 text-[13px] font-bold text-ink-900";

type MemoBoxProps = { row: RouteStopData["row"] };

/** 메모 상자(#F7F8FA · r10) — 메모마다 한 줄, 영업하는 날은 운영시간. 아무것도 없으면 「메모가 없어요」 */
function MemoBox({ row }: MemoBoxProps) {
  const hours = row.hours && !row.hoursOff ? row.hours : null;
  const empty = row.memos.length === 0 && !hours;
  return (
    <div className="flex flex-col gap-1.25 rounded-memo bg-surface-sunken px-3 py-2.5">
      {row.memos.map((memo) => (
        <p key={memo.id} className="text-[13px]/[1.45] whitespace-pre-line text-ink-700">
          {memo.starred ? "★ " : "· "}
          {memo.body}
        </p>
      ))}
      {hours && <p className="text-[13px]/[1.45] text-ink-700">· 운영 {hours}</p>}
      {empty && <p className="text-[13px] text-ink-350">메모가 없어요</p>}
    </div>
  );
}
