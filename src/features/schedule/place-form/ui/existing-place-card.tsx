import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  DEFAULT_PLACE_EMOJI,
  type Place,
  PLACE_CATEGORIES,
} from "@/entities/schedule-item";

type ExistingPlaceCardProps = { place: Place };

/** 카테고리 값이 아는 것이면 그 키, 아니면 null */
function categoryKey(value: string | null) {
  return PLACE_CATEGORIES.find((c) => c === value) ?? null;
}

/**
 * 위치 검색으로 고른 곳이 이미 있는 장소일 때의 안내 — 「이미 저장된 장소예요」 + 그 장소의 아이콘 · 이름 · 카테고리 · 주소.
 * 내가 아니라 일행 · 운영자가 넣은 장소일 수 있어 「저장된」(수동형)으로 안내한다.
 * 쓸지 새로 등록할지는 하단 버튼으로 고른다(같은 구글 장소를 새로 만들면 장소가 둘로 갈린다).
 */
export function ExistingPlaceCard({ place }: ExistingPlaceCardProps) {
  const category = categoryKey(place.category);
  const meta = [category && CATEGORY_LABEL[category], place.address].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col gap-2 rounded-card border border-status-ok/30 bg-surface-memo px-3.5 py-3">
      <span className="text-[13px] font-bold text-status-ok">
        이미 저장된 장소예요. 이 장소를 쓸까요?
      </span>
      <div className="flex items-center gap-2.5">
        <span className="text-[22px]/none" aria-hidden="true">
          {place.emoji ?? (category ? CATEGORY_EMOJI[category] : DEFAULT_PLACE_EMOJI)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold text-ink-900">{place.name}</span>
          {meta && <span className="truncate text-xs text-ink-400">{meta}</span>}
        </div>
      </div>
    </div>
  );
}
