"use client";

import { Link as LinkIcon, MapPin, Pencil, Plus } from "lucide-react";

import {
  CATEGORY_LABEL,
  isHttpUrl,
  placeLinksOf,
  placeSubtypeOf,
  SUBTYPE_LABEL,
} from "@/entities/schedule-item";
import { PlaceInfoLine, placeInfoRows } from "@/features/schedule/item-detail";
import { withKeys } from "@/shared/lib/keys";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { GuideCard } from "../../lib/guide";
import { PlacedChip, WaitChip } from "./guide-card";

/** 상세에서 할 수 있는 것 — 카드 ⋯ · 「+ 일정」 과 같다 */
type DetailActions = {
  onAdd: (card: GuideCard) => void;
  onMemo: (card: GuideCard) => void;
  /** 장소 정보 수정 — 만든 사람의 장소만 보인다 */
  onEdit: (card: GuideCard) => void;
  myId: string | null;
};

type GuideDetailProps = DetailActions & {
  /** 연 카드. null 이면 닫힘 */
  card: GuideCard | null;
  onClose: () => void;
};

/**
 * 가이드 상세 — 모바일은 바텀시트, PC 는 가운데 480 창. 종류 · 지역 · 배치 칩, 이름 20/800, 대기,
 * 장소 정보 표(일정 상세와 같은 줄 — 설명 · 주소 · 별점 · 운영시간), 이 여행의 메모(쓰기/고치기), 장소 링크,
 * 아래 ✏️(장소 정보 수정, 만든 사람만) · 구글맵 · 「일정에 추가」(아직 일정에 없을 때)
 */
export function GuideDetail({ card, onClose, ...actions }: GuideDetailProps) {
  const shown = useHeldWhileClosing(card !== null, card);
  return (
    <SheetDialog open={card !== null} onClose={onClose} ariaTitle={shown?.place.name ?? "장소"}>
      {shown && <DetailBody card={shown} {...actions} />}
    </SheetDialog>
  );
}

type DetailBodyProps = DetailActions & { card: GuideCard };

/** 창 안 */
function DetailBody({ card, onAdd, onMemo, onEdit, myId }: DetailBodyProps) {
  const { place } = card;
  const kind = kindOf(place);
  const links = placeLinksOf({ place });
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5">
          {kind && (
            <span className="flex h-6 items-center rounded-full bg-surface-muted px-2.25 text-xs font-bold text-ink-700">
              {kind}
            </span>
          )}
          {card.area && (
            <span className="flex h-6 items-center rounded-full bg-surface-muted px-2.25 text-xs font-bold text-ink-700">
              {card.area}
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
      <div className="flex flex-col gap-1.5 rounded-card bg-surface-sunken px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-400">이 여행 메모</span>
          <button
            type="button"
            onClick={() => onMemo(card)}
            className="cursor-pointer text-xs font-bold text-brand-text"
          >
            {card.memo ? "고치기" : "쓰기"}
          </button>
        </div>
        {card.memo ? (
          <p className="text-sm/relaxed text-pretty whitespace-pre-line text-ink-700">
            {card.memo}
          </p>
        ) : (
          <p className="text-[13px] text-ink-350">일행과 함께 볼 메모를 남겨 보세요.</p>
        )}
      </div>
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
      <div className="mt-1 flex gap-2">
        {place.created_by === myId && (
          <button
            type="button"
            aria-label="장소 정보 수정"
            title="장소 정보 수정"
            onClick={() => onEdit(card)}
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-button border border-line-strong text-ink-700"
          >
            <Pencil className="size-4.5" />
          </button>
        )}
        {isHttpUrl(place.gmap_url) && (
          <a
            href={place.gmap_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-button border border-line-strong text-[15px] font-bold text-ink-700"
          >
            <MapPin className="size-4" aria-hidden="true" />
            구글맵
          </a>
        )}
        {card.day === null && (
          <button
            type="button"
            onClick={() => onAdd(card)}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-button bg-brand text-[15px] font-bold text-on-brand"
          >
            <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" />
            일정에 추가
          </button>
        )}
      </div>
    </div>
  );
}

/** 종류 칩 글자 — 메뉴 · 종류가 있으면 그것(「🍜 라멘 · 면」), 없으면 카테고리(「음식점」), 둘 다 없으면 null */
function kindOf(place: GuideCard["place"]): string | null {
  const subtype = placeSubtypeOf(place);
  if (subtype) return SUBTYPE_LABEL[subtype];
  const category = place.category as keyof typeof CATEGORY_LABEL | null;
  return category && category in CATEGORY_LABEL ? CATEGORY_LABEL[category] : null;
}
