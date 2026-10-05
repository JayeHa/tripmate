"use client";

import {
  byCreatedAt,
  type Memo,
  MemoCard,
  type ScheduleItem,
  useMemos,
} from "@/entities/schedule-item";
import { useMemberLookup } from "@/entities/trip-member";

type MemoBlockProps = {
  tripId: string;
  item: ScheduleItem;
  /** 「+ 메모」 */
  onAdd: () => void;
  /** 메모를 누르면 고치기 · 지우기(여행 멤버 누구나) */
  onEdit: (memo: Memo) => void;
};

/**
 * 메모 — 「메모 N」 + 오른쪽 「+ 메모」, 아래 메모 목록(작성자 · ★ 중요 · 쓴 시각 · 본문 · 링크). 쓴 순서.
 * 메모를 누르면 작성 창이 고치기로 열린다
 */
export function MemoBlock({ tripId, item, onAdd, onEdit }: MemoBlockProps) {
  const { data: all = [] } = useMemos(tripId);
  const authorOf = useMemberLookup(tripId);
  const memos = all.filter((m) => m.schedule_item_id === item.id).sort(byCreatedAt);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">메모 {memos.length}</span>
        <button type="button" onClick={onAdd} className="text-sm font-bold text-primary">
          + 메모
        </button>
      </div>
      {memos.map((memo) => (
        <MemoCard
          key={memo.id}
          memo={memo}
          author={authorOf(memo.author_id)}
          onClick={() => onEdit(memo)}
        />
      ))}
      {memos.length === 0 && <span className="text-[13px] text-ink-350">아직 메모가 없어요.</span>}
    </section>
  );
}
