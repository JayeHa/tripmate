import { ChevronLeft, MapPin, Navigation, Pencil, Plus } from "lucide-react";

import { isHttpUrl } from "@/entities/schedule-item";

import { type GuideCard, guideKindLabel } from "../../../lib/guide";
import { directionsUrl, type GuidePin } from "../../../lib/guide-map";
import { WaitChip } from "../guide-card";
import { MetaLine, SmallPlacedChip } from "./guide-map-parts";

type GuideMapDetailProps = {
  pin: GuidePin;
  onBack: () => void;
  onAdd: (card: GuideCard) => void;
  /** 장소 정보 수정 — 만든 사람의 장소만, 아니면 null */
  onEdit: ((card: GuideCard) => void) | null;
};

const CHIP =
  "flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-line px-3.5 text-sm font-bold text-ink-700";

/**
 * 지도 시트 · 패널의 장소 상세 — 「‹ 목록」 · 종류 · 배치 칩, 이름 20/800, 「★ 평점 (리뷰) · 지역」 · 대기,
 * 설명, 행동 칩 줄(「+ 일정」 아직 안 넣었을 때 · 길찾기 · 구글맵 · 수정), 이 여행의 메모. 사진은 넣지 않는다
 */
export function GuideMapDetail({ pin, onBack, onAdd, onEdit }: GuideMapDetailProps) {
  const { card } = pin;
  const { place } = card;
  const kind = guideKindLabel(place);
  return (
    <div className="flex flex-col gap-3.5 px-5 pt-1 pb-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            className="-ml-1.5 flex h-7 cursor-pointer items-center gap-0.5 rounded-button px-1.5 text-[13px] font-bold text-ink-500"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            목록
          </button>
          <span className="flex-1" />
          {kind && (
            <span className="flex h-6 shrink-0 items-center rounded-full bg-surface-muted px-2.25 text-xs font-bold whitespace-nowrap text-ink-700">
              {kind}
            </span>
          )}
          {card.day !== null && <SmallPlacedChip day={card.day} size="md" />}
        </div>
        <h3 className="text-xl/snug font-extrabold tracking-tight text-pretty text-ink-900">
          {place.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <MetaLine place={place} area={card.area} />
          {place.wait && <WaitChip wait={place.wait} />}
        </div>
        {place.description && (
          <p className="text-sm/normal text-pretty whitespace-pre-line text-ink-700">
            {place.description}
          </p>
        )}
      </div>
      <div className="-mx-5 flex scrollbar-none gap-1.5 overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
        {card.day === null && (
          <button
            type="button"
            onClick={() => onAdd(card)}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-brand px-3.5 text-sm font-bold text-on-brand"
          >
            <Plus className="size-3.75" strokeWidth={2.4} aria-hidden="true" />
            일정
          </button>
        )}
        <a
          href={directionsUrl(pin.at, place.google_place_id)}
          target="_blank"
          rel="noopener noreferrer"
          className={CHIP}
        >
          <Navigation className="size-3.75" aria-hidden="true" />
          길찾기
        </a>
        {isHttpUrl(place.gmap_url) && (
          <a href={place.gmap_url} target="_blank" rel="noopener noreferrer" className={CHIP}>
            <MapPin className="size-3.75" aria-hidden="true" />
            구글맵
          </a>
        )}
        {onEdit && (
          <button type="button" onClick={() => onEdit(card)} className={CHIP}>
            <Pencil className="size-3.75" aria-hidden="true" />
            수정
          </button>
        )}
      </div>
      {card.memo && (
        <p className="rounded-card bg-surface-sunken px-4 py-3.5 text-sm/[1.7] text-pretty whitespace-pre-line text-ink-700">
          {card.memo}
        </p>
      )}
    </div>
  );
}
