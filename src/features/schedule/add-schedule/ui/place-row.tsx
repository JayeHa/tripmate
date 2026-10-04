import {
  Bath,
  BedDouble,
  Check,
  Coffee,
  Landmark,
  Loader2,
  type LucideIcon,
  MapPin,
  Plane,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import type { PlaceCategory } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

/** 카테고리 썸네일: 아이콘과 옅은 바탕 · 진한 아이콘색. 카테고리를 모르면(구글 결과) 회색 핀 */
const CATEGORY_THUMB = {
  sight: { icon: Landmark, tone: "bg-[#F1ECFE] text-cat-sight" },
  food: { icon: UtensilsCrossed, tone: "bg-[#FDE8EA] text-cat-food" },
  cafe: { icon: Coffee, tone: "bg-[#F5EEE3] text-cat-cafe" },
  shop: { icon: ShoppingBag, tone: "bg-[#FEF3DC] text-cat-shop" },
  rest: { icon: Bath, tone: "bg-[#FCE7F3] text-cat-rest" },
  stay: { icon: BedDouble, tone: "bg-[#E3F6F3] text-cat-stay" },
  air: { icon: Plane, tone: "bg-[#E8F1FF] text-cat-air" },
} satisfies Record<PlaceCategory, { icon: LucideIcon; tone: string }>;

const UNKNOWN_THUMB = { icon: MapPin, tone: "bg-surface-muted text-ink-400" };

type PlaceRowProps = {
  name: string;
  category: PlaceCategory | null;
  /** 둘째 줄(카테고리 · 지역 / 구글 주소) */
  meta: string | null;
  rating?: number | null;
  description?: string | null;
  /** 여행 일정에 이미 있는 장소(날짜 무관) */
  inTrip: boolean;
  chosen: boolean;
  /** 고르는 중(상세를 받는 중). 오른쪽에 로딩 표시 */
  busy?: boolean;
  onToggle: () => void;
};

/**
 * 장소 한 줄: 56 썸네일 · 이름 16/700 + 「일정에 있음」 · 둘째 줄 · ★ 별점 + 설명 · 오른쪽 「선택」/파란 체크.
 * 줄 전체가 고르기 버튼이다.
 */
export function PlaceRow({
  name,
  category,
  meta,
  rating,
  description,
  inTrip,
  chosen,
  busy,
  onToggle,
}: PlaceRowProps) {
  const thumb = category ? CATEGORY_THUMB[category] : UNKNOWN_THUMB;
  const hasThird = rating != null || !!description;
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-3 text-left",
        chosen ? "bg-surface-memo" : "bg-white",
      )}
    >
      <span
        className={cn("flex size-14 shrink-0 items-center justify-center rounded-memo", thumb.tone)}
      >
        <thumb.icon className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-base font-bold tracking-[-0.01em] text-ink-900">
            {name}
          </span>
          {inTrip && (
            <span className="shrink-0 rounded-tag bg-status-ok-bg px-1.5 py-0.5 text-[11px] font-bold text-status-ok">
              일정에 있음
            </span>
          )}
        </span>
        {meta && <span className="truncate text-[13px] text-ink-400">{meta}</span>}
        {hasThird && (
          <span className="flex min-w-0 gap-1.5 text-[13px]">
            {rating != null && (
              <span className="shrink-0 font-bold text-star">★ {rating.toFixed(1)}</span>
            )}
            {description && <span className="truncate text-ink-500">{description}</span>}
          </span>
        )}
      </span>
      {busy && (
        <span className="flex size-8 shrink-0 items-center justify-center text-ink-400">
          <Loader2 className="size-4.5 animate-spin" aria-label="불러오는 중" />
        </span>
      )}
      {!busy && chosen && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Check className="size-4.5" strokeWidth={3} />
        </span>
      )}
      {!busy && !chosen && (
        <span className="flex h-8 shrink-0 items-center rounded-full border border-line-strong px-3 text-[13px] font-bold text-ink-700">
          선택
        </span>
      )}
    </button>
  );
}
