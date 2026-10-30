"use client";

import { Plus } from "lucide-react";

import type { GuideCard as Card } from "../../lib/guide";
import type { GuideActions } from "../../model/use-guide-actions";
import { useGuidePaging } from "../../model/use-guide-paging";
import { GuideCard } from "./guide-card";

type GuideListProps = {
  /** 필터 · 정렬을 건 카드 */
  cards: Card[];
  /** 비었을 때 안내 */
  emptyText: string;
  /** 맨 아래 「+ ○○ 추가」 글자 */
  addLabel: string;
  a: GuideActions;
};

/**
 * 가이드 카드 목록 — 모바일 한 줄, PC 3열(같은 줄 높이 맞춤). 15장씩 그리고 끝에 닿으면 더.
 * 다 그린 뒤 맨 아래 「+ ○○ 추가」. 필터가 바뀌면 부모가 key 로 새로 그려 처음 15장부터
 */
export function GuideList({ cards, emptyText, addLabel, a }: GuideListProps) {
  const { limit, hasMore, watchEnd } = useGuidePaging(cards.length);
  return (
    <>
      {cards.length === 0 && (
        <p className="py-9 text-center text-sm/relaxed text-ink-400">{emptyText}</p>
      )}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-2.5 lg:grid-cols-3 lg:items-stretch">
          {cards.slice(0, limit).map((card) => (
            <GuideCard
              key={card.place.id}
              card={card}
              onOpen={() => a.openDetail(card.place.id)}
              onAdd={() => a.day.ask(card)}
              onEdit={card.place.created_by === a.myId ? () => a.edit.ask(card) : null}
              onMemo={() => a.memo.ask(card)}
              onRemove={() => a.remove.ask(card)}
            />
          ))}
        </div>
      )}
      {hasMore && (
        <div ref={watchEnd} className="py-3.5 text-center text-[13px] text-ink-400">
          불러오는 중…
        </div>
      )}
      {!hasMore && (
        <button
          type="button"
          onClick={a.create.ask}
          className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-dashed bg-white text-[15px] font-bold text-brand"
        >
          <Plus className="size-4.5" strokeWidth={2.2} aria-hidden="true" />
          {addLabel}
        </button>
      )}
    </>
  );
}
