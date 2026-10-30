"use client";

import { Link as LinkIcon, MapPin } from "lucide-react";

import { CATEGORY_LABEL, isHttpUrl, placeLinksOf } from "@/entities/schedule-item";
import { PlaceInfoLine, placeInfoRows } from "@/features/schedule/item-detail";
import { withKeys } from "@/shared/lib/keys";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { GuideCard } from "../../lib/guide";
import { PlacedChip, WaitChip } from "./guide-card";

type GuideDetailProps = {
  /** 연 카드. null 이면 닫힘 */
  card: GuideCard | null;
  onClose: () => void;
};

/**
 * 가이드 상세 — 모바일은 바텀시트, PC 는 가운데 480 창. 종류 · 배치 칩, 이름 20/800, 대기,
 * 장소 정보 표(일정 상세와 같은 줄 — 설명 · 주소 · 별점 · 운영시간), 이 여행의 메모, 장소 링크, 아래 구글맵
 */
export function GuideDetail({ card, onClose }: GuideDetailProps) {
  const shown = useHeldWhileClosing(card !== null, card);
  return (
    <SheetDialog open={card !== null} onClose={onClose} ariaTitle={shown?.place.name ?? "장소"}>
      {shown && <DetailBody card={shown} />}
    </SheetDialog>
  );
}

type DetailBodyProps = { card: GuideCard };

/** 창 안 */
function DetailBody({ card }: DetailBodyProps) {
  const { place } = card;
  const category = place.category as keyof typeof CATEGORY_LABEL | null;
  const links = placeLinksOf({ place });
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5">
          {category && category in CATEGORY_LABEL && (
            <span className="flex h-6 items-center rounded-full bg-surface-muted px-2.25 text-xs font-bold text-ink-700">
              {CATEGORY_LABEL[category]}
            </span>
          )}
          {card.day !== null && <PlacedChip day={card.day} />}
        </div>
        <p className="text-xl/snug font-extrabold tracking-[-0.01em] text-pretty text-ink-900">
          {card.emoji && <span className="mr-1">{card.emoji}</span>}
          {place.name}
        </p>
        {place.wait && (
          <div className="flex">
            <WaitChip wait={place.wait} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        {placeInfoRows(place, null).map((row) => (
          <PlaceInfoLine key={row.label} row={row} />
        ))}
      </div>
      {card.memo && (
        <p className="rounded-card bg-surface-sunken px-4 py-3.5 text-sm/relaxed text-pretty whitespace-pre-line text-ink-700">
          {card.memo}
        </p>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {withKeys(links, (l) => `${l.title}:${l.url}`).map(({ key, value: l }) => (
            <a
              key={key}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 items-center gap-1.25 rounded-full border border-line bg-white px-2.5 text-xs font-semibold text-ink-700"
            >
              <LinkIcon className="size-3.25 text-ink-500" aria-hidden="true" />
              {l.title || "링크"}
            </a>
          ))}
        </div>
      )}
      {isHttpUrl(place.gmap_url) && (
        <a
          href={place.gmap_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex h-12 items-center justify-center gap-1.5 rounded-button border border-line-strong text-[15px] font-bold text-ink-700"
        >
          <MapPin className="size-4" aria-hidden="true" />
          구글맵
        </a>
      )}
    </div>
  );
}
