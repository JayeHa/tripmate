"use client";

import { byCreatedAt, type Memo, MemoCard, useMemos } from "@/entities/schedule-item";
import { useMemberLookup } from "@/entities/trip-member";

type FlightMemosProps = {
  tripId: string;
  /** 항공편의 일정 카드 id — 메모는 카드에 붙는다 */
  cardId: string;
  /** 「+ 메모」(null) · 메모 누르기(그 메모) — 상세를 닫고 메모 작성 창을 연다 */
  onMemo: (memo: Memo | null) => void;
};

/**
 * 항공편 상세의 메모 — 「메모 N」 + 「+ 메모」, 아래 일정 카드의 메모 목록(쓴 순서). 없으면 「메모가 없어요.」.
 * 카드가 없는(탑승일이 여행 기간 밖) 항공편에는 그리지 않는다 — 메모를 붙일 곳이 없다
 */
export function FlightMemos({ tripId, cardId, onMemo }: FlightMemosProps) {
  const { data: all = [] } = useMemos(tripId);
  const authorOf = useMemberLookup(tripId);
  const memos = all.filter((m) => m.schedule_item_id === cardId).sort(byCreatedAt);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold text-ink-900">
          메모{memos.length > 0 && ` ${memos.length}`}
        </span>
        <button
          type="button"
          onClick={() => onMemo(null)}
          className="text-sm font-bold text-primary"
        >
          + 메모
        </button>
      </div>
      {memos.map((memo) => (
        <MemoCard
          key={memo.id}
          memo={memo}
          author={authorOf(memo.author_id)}
          onClick={() => onMemo(memo)}
        />
      ))}
      {memos.length === 0 && <span className="text-[13px] text-ink-350">메모가 없어요.</span>}
    </section>
  );
}
