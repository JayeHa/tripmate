import { MapPin } from "lucide-react";

import { isHttpUrl } from "@/entities/schedule-item";

import { type GuideCard as Card, isLongText, reviewsLabel } from "../../lib/guide";

type GuideCardProps = { card: Card; onOpen: () => void };

/**
 * 가이드 카드(r12) — 이름 16/800 · 「day N 배치됨」 · ★ 별점 · ⏱ 대기 · 설명 3줄 · 이 여행의 메모 3줄 · 「자세히 보기」 · 구글맵.
 * 카드 어디를 눌러도 상세가 열린다(이름 버튼을 카드 전체로 늘린다). 구글맵만 따로 눌린다
 */
export function GuideCard({ card, onOpen }: GuideCardProps) {
  const { place } = card;
  const long = isLongText(place.description) || isLongText(card.memo);
  return (
    <article className="relative flex flex-col gap-1.5 rounded-card border border-line-card bg-white px-4 py-3.5 shadow-card">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-base/snug font-extrabold text-pretty text-ink-900">
          <button
            type="button"
            onClick={onOpen}
            className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-card"
          >
            {card.emoji && <span className="mr-1">{card.emoji}</span>}
            {place.name}
          </button>
        </h3>
        {card.day !== null && <PlacedChip day={card.day} />}
      </div>
      {(place.rating != null || place.wait) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {place.rating != null && (
            <span className="text-[13px] font-bold text-ink-900">
              ★ {place.rating.toFixed(1)}
              <span className="font-medium text-ink-400"> {reviewsLabel(place)}</span>
            </span>
          )}
          {place.wait && <WaitChip wait={place.wait} />}
        </div>
      )}
      {place.description && (
        <p className="line-clamp-3 text-sm/normal text-pretty whitespace-pre-line text-ink-700">
          {place.description}
        </p>
      )}
      {card.memo && (
        <p className="line-clamp-3 text-[13px]/relaxed text-pretty whitespace-pre-line text-ink-500">
          {card.memo}
        </p>
      )}
      <div className="flex items-center gap-1.5 pt-1">
        {long && <span className="text-[13px] font-bold text-ink-400">자세히 보기</span>}
        <span className="flex-1" />
        {isHttpUrl(place.gmap_url) && (
          <a
            href={place.gmap_url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex h-7.5 items-center gap-1 rounded-full border border-line px-2.5 text-[13px] font-semibold text-ink-700"
          >
            <MapPin className="size-3.25 text-ink-500" aria-hidden="true" />
            구글맵
          </a>
        )}
      </div>
    </article>
  );
}

type PlacedChipProps = { day: number };

/** 「day N 배치됨」 — 연파랑 알약 */
export function PlacedChip({ day }: PlacedChipProps) {
  return (
    <span className="flex h-5.5 shrink-0 items-center rounded-full bg-brand-soft px-2 text-xs font-extrabold text-brand-text">
      day {day + 1} 배치됨
    </span>
  );
}

type WaitChipProps = { wait: string };

/** 「⏱ 대기 30분」 — 연주황 알약 */
export function WaitChip({ wait }: WaitChipProps) {
  return (
    <span className="flex h-5.5 items-center gap-0.75 rounded-full bg-status-wait-bg px-2 text-xs font-bold text-status-wait-text">
      ⏱ {wait}
    </span>
  );
}
