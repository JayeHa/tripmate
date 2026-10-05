"use client";

import {
  byCreatedAt,
  type Memo,
  MemoCard,
  type ScheduleItem,
  useMemos,
} from "@/entities/schedule-item";
import { useMemberLookup } from "@/entities/trip-member";
import { CircleAddButton } from "@/shared/ui/add-controls";

type MemoBlockProps = {
  tripId: string;
  item: ScheduleItem;
  /** 제목 오른쪽 「+」 */
  onAdd: () => void;
  /** 메모를 누르면 고치기 · 지우기(여행 멤버 누구나) */
  onEdit: (memo: Memo) => void;
};

/**
 * 메모 — 「메모 N」 + 오른쪽 회색 원 「+」, 아래 메모 목록(작성자 · ★ 중요 · 쓴 시각 · 본문 · 링크). 쓴 순서.
 * 메모를 누르면 작성 창이 고치기로 열린다. 메모가 없으면 칸을 그리지 않는다(맨 아래 「추가」 줄의 칩으로 쓴다)
 */
export function MemoBlock({ tripId, item, onAdd, onEdit }: MemoBlockProps) {
  const { data: all = [] } = useMemos(tripId);
  const authorOf = useMemberLookup(tripId);
  const memos = all.filter((m) => m.schedule_item_id === item.id).sort(byCreatedAt);
  if (memos.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">메모 {memos.length}</span>
        <CircleAddButton label="메모 추가" onClick={onAdd} />
      </div>
      {memos.map((memo) => (
        <MemoCard
          key={memo.id}
          memo={memo}
          author={authorOf(memo.author_id)}
          onClick={() => onEdit(memo)}
        />
      ))}
    </section>
  );
}
