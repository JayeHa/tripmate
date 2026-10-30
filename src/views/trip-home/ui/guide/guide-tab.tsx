"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

import { useAlternatives, useGuidePlaces, useScheduleItems } from "@/entities/schedule-item";
import { Skeleton } from "@/shared/ui/skeleton";

import { guideCards, type GuideTab as Tab } from "../../lib/guide";
import { useGuidePaging } from "../../model/use-guide-paging";
import { GuideCard } from "./guide-card";
import { GuideDetail } from "./guide-detail";

type GuideTabProps = { tripId: string; tab: Tab };

/**
 * 가이드 탭(관광지 · 식당 · 쇼핑 · 휴식) — 이 여행 보관함의 장소를 카드로. 모바일 한 줄, PC 3열(가운데 1080).
 * 일정에 넣은 장소는 「day N 배치됨」. 15장씩 그리고 끝에 닿으면 더. 카드를 누르면 상세
 */
export function GuideTab({ tripId, tab }: GuideTabProps) {
  const { data: rows } = useGuidePlaces(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  // 대체 장소 줄은 일정 조회에 없다 — 대체 장소로만 넣은 장소의 이모지를 찾으려고 함께 넘긴다
  const { data: alternatives = [] } = useAlternatives(tripId);
  const cards = rows ? guideCards(rows, [...items, ...alternatives], tab) : null;
  const { limit, hasMore, watchEnd } = useGuidePaging(cards?.length ?? 0);
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = cards?.find((c) => c.place.id === openId) ?? null;

  return (
    <div className="flex flex-1 flex-col bg-surface-sunken">
      <div className="flex w-full flex-col gap-4.5 px-4 pt-4.5 pb-7 lg:mx-auto lg:max-w-270 lg:px-10 lg:pt-7 lg:pb-10">
        <p className="flex items-center gap-1.5 text-xs text-ink-400">
          <MapPin className="size-3.25" aria-hidden="true" />
          <span>
            <b className="font-bold text-ink-700">이 여행의 장소</b> · 일행과 함께 모아요. 일정에
            넣은 장소도 여기 남아요
          </span>
        </p>
        {cards === null && <GuideSkeleton />}
        {cards?.length === 0 && (
          <p className="py-9 text-center text-sm/relaxed text-ink-400">
            아직 장소가 없어요. 가고 싶은 곳을 모아 두면 일정에 바로 넣을 수 있어요.
          </p>
        )}
        {cards && cards.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-2.5 lg:grid-cols-3">
            {cards.slice(0, limit).map((card) => (
              <GuideCard key={card.place.id} card={card} onOpen={() => setOpenId(card.place.id)} />
            ))}
          </div>
        )}
        {hasMore && (
          <div ref={watchEnd} className="py-3.5 text-center text-[13px] text-ink-400">
            불러오는 중…
          </div>
        )}
      </div>
      <GuideDetail card={opened} onClose={() => setOpenId(null)} />
    </div>
  );
}

/** 보관함을 읽는 동안 — 카드 세 장 자리 */
function GuideSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
      <Skeleton className="h-36 rounded-card" />
    </div>
  );
}
