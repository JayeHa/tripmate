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

/** 카테고리마다 아이콘과 색 */
const CATEGORY_ICON: Record<ExpenseCategory, { Icon: LucideIcon; tone: string }> = {
  lodging: { Icon: House, tone: "text-cat-stay" },
  flight: { Icon: Plane, tone: "text-cat-air" },
  transport: { Icon: TrainFront, tone: "text-cat-move" },
  activity: { Icon: Ticket, tone: "text-cat-sight" },
  food: { Icon: UtensilsCrossed, tone: "text-cat-food" },
  shopping: { Icon: ShoppingBag, tone: "text-cat-shop" },
  other: { Icon: Ellipsis, tone: "text-cat-etc" },
};

type ExpenseCategoryIconProps = {
  category: ExpenseCategory;
  className?: string;
};

/** 지출 카테고리 아이콘 — 색은 카테고리마다 정해져 있고 크기는 부른 쪽이 정한다 */
export function ExpenseCategoryIcon({ category, className }: ExpenseCategoryIconProps) {
  const { Icon, tone } = CATEGORY_ICON[category] ?? CATEGORY_ICON.other;
  return <Icon aria-hidden="true" strokeWidth={2} className={cn("shrink-0", tone, className)} />;
}
