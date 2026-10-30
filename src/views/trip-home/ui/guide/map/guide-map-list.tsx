import type { GuidePin } from "../../../lib/guide-map";
import { MetaLine, PinNumber, SmallPlacedChip } from "./guide-map-parts";

type GuideMapListProps = {
  pins: GuidePin[];
  /** 좌표가 없어 지도에 없는 장소 수 */
  noLocation: number;
  onPick: (placeId: string) => void;
};

/**
 * 지도 시트 · 패널의 장소 목록 — 머리 「장소 N곳」(+ 「위치 없는 N곳은 목록에서」), 줄마다 번호 원 · 이름 · 배치 칩 ·
 * 「★ 평점 (리뷰) · 지역」 · 설명 한 줄. 줄을 누르면 그 장소 상세
 */
export function GuideMapList({ pins, noLocation, onPick }: GuideMapListProps) {
  return (
    <div className="flex flex-col">
      <div className="flex min-h-10 items-center gap-2 px-5 pt-1">
        <span className="flex-1 text-base font-extrabold text-ink-900">장소 {pins.length}곳</span>
        {noLocation > 0 && (
          <span className="text-xs text-ink-400">위치 없는 {noLocation}곳은 목록에서</span>
        )}
      </div>
      <ul className="px-5 pb-6">
        {pins.map(({ card, num }) => (
          <li key={card.place.id}>
            <button
              type="button"
              onClick={() => onPick(card.place.id)}
              className="flex w-full cursor-pointer items-start gap-2.5 border-t border-surface-muted py-3.5 text-left"
            >
              <PinNumber num={num} placed={card.day !== null} className="mt-px" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                <span className="flex items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-ink-900">
                    {card.place.name}
                  </span>
                  {card.day !== null && <SmallPlacedChip day={card.day} size="sm" />}
                </span>
                <MetaLine place={card.place} area={card.area} />
                {card.place.description && (
                  <span className="truncate text-[13px] text-ink-600">
                    {card.place.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
