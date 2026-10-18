import {
  Bath,
  BedDouble,
  Coffee,
  Landmark,
  type LucideIcon,
  MapPin,
  Plane,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { PlaceCategory } from "../model/place";

/** 카테고리 썸네일: 아이콘과 옅은 바탕(`-soft`) · 진한 아이콘색. 카테고리를 모르면 회색 핀 */
const CATEGORY_THUMB = {
  sight: { icon: Landmark, tone: "bg-cat-sight-soft text-cat-sight" },
  food: { icon: UtensilsCrossed, tone: "bg-cat-food-soft text-cat-food" },
  cafe: { icon: Coffee, tone: "bg-cat-cafe-soft text-cat-cafe" },
  shop: { icon: ShoppingBag, tone: "bg-cat-shop-soft text-cat-shop" },
  rest: { icon: Bath, tone: "bg-cat-rest-soft text-cat-rest" },
  stay: { icon: BedDouble, tone: "bg-cat-stay-soft text-cat-stay" },
  air: { icon: Plane, tone: "bg-cat-air-soft text-cat-air" },
} satisfies Record<PlaceCategory, { icon: LucideIcon; tone: string }>;

const UNKNOWN_THUMB = { icon: MapPin, tone: "bg-surface-muted text-ink-400" };

/** 크기 — lg 56(장소 검색 줄) · sm 28(일정 연결 줄) */
const SIZE = {
  lg: { box: "size-14 rounded-memo", icon: "size-6" },
  sm: { box: "size-7 rounded-button", icon: "size-4" },
};

type CategoryThumbProps = { category: PlaceCategory | null; size: keyof typeof SIZE };

/** 장소 카테고리 아이콘 칸 */
export function CategoryThumb({ category, size }: CategoryThumbProps) {
  const thumb = category ? CATEGORY_THUMB[category] : UNKNOWN_THUMB;
  const look = SIZE[size];
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", look.box, thumb.tone)}
      aria-hidden="true"
    >
      <thumb.icon className={look.icon} />
    </span>
  );
}
