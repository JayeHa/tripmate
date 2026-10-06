import {
  Ellipsis,
  House,
  type LucideIcon,
  Plane,
  ShoppingBag,
  Ticket,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ExpenseCategory } from "../model/types";

/** 카테고리마다 아이콘 · 진한 색(아이콘) · 옅은 색(타일 바탕) */
const CATEGORY_ICON: Record<ExpenseCategory, { Icon: LucideIcon; tone: string; soft: string }> = {
  food: { Icon: UtensilsCrossed, tone: "text-cat-food", soft: "bg-cat-food-soft" },
  transport: { Icon: TrainFront, tone: "text-cat-move", soft: "bg-cat-move-soft" },
  shopping: { Icon: ShoppingBag, tone: "text-cat-shop", soft: "bg-cat-shop-soft" },
  activity: { Icon: Ticket, tone: "text-cat-sight", soft: "bg-cat-sight-soft" },
  lodging: { Icon: House, tone: "text-cat-stay", soft: "bg-cat-stay-soft" },
  flight: { Icon: Plane, tone: "text-cat-air", soft: "bg-cat-air-soft" },
  other: { Icon: Ellipsis, tone: "text-cat-etc", soft: "bg-cat-etc-soft" },
};

/** 모르는 카테고리(옛 데이터)는 기타로 그린다 */
function iconOf(category: ExpenseCategory) {
  return CATEGORY_ICON[category] ?? CATEGORY_ICON.other;
}

type ExpenseCategoryIconProps = {
  category: ExpenseCategory;
  /** false 면 카테고리 색 대신 글자 색을 따른다 — 고르는 칩처럼 바탕이 바뀌는 곳 */
  tone?: boolean;
  className?: string;
};

/** 지출 카테고리 아이콘 — 색은 카테고리마다 정해져 있고 크기는 부른 쪽이 정한다 */
export function ExpenseCategoryIcon({
  category,
  tone = true,
  className,
}: ExpenseCategoryIconProps) {
  const icon = iconOf(category);
  return (
    <icon.Icon
      aria-hidden="true"
      strokeWidth={2}
      className={cn("shrink-0", tone && icon.tone, className)}
    />
  );
}

/** 타일 크기 — 목록 38 · r11 · 아이콘 19 / 카드(통계 · 표) 28 · r8 · 아이콘 15 */
const TILE = {
  md: { box: "size-9.5 rounded-[11px]", icon: "size-4.75" },
  sm: { box: "size-7 rounded-button", icon: "size-3.75" },
} as const;

type ExpenseCategoryTileProps = {
  category: ExpenseCategory;
  size?: keyof typeof TILE;
  className?: string;
};

/** 카테고리 타일 — 옅은 색 바탕에 진한 색 아이콘. 이모지는 쓰지 않는다 */
export function ExpenseCategoryTile({
  category,
  size = "md",
  className,
}: ExpenseCategoryTileProps) {
  const { Icon, tone, soft } = iconOf(category);
  const t = TILE[size];
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center", soft, t.box, className)}
    >
      <Icon strokeWidth={2} className={cn(tone, t.icon)} />
    </span>
  );
}
