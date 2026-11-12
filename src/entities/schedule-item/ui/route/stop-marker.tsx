import { cn } from "@/shared/lib/utils";

import type { StopKind } from "../../lib/route-day";
import type { PlaceCategory } from "../../model/place";

/**
 * 역의 상태 — 계획 모드(visited = 계획 모드의 다녀옴) · 기록 모드의 다녀옴 · 지금 여기 · 남음 · 패스(두 모드 같다)
 */
export type StopTone = "plan" | "visited" | "done" | "current" | "todo" | "pass";

/** 일반 장소 표식의 채움 — 카테고리 색. 카테고리가 없으면 회색 */
const CATEGORY_FILL: Record<PlaceCategory, string> = {
  sight: "bg-cat-sight",
  food: "bg-cat-food",
  cafe: "bg-cat-cafe",
  shop: "bg-cat-shop",
  rest: "bg-cat-rest",
  stay: "bg-cat-stay",
  air: "bg-cat-air",
};

/**
 * 테두리는 목록 바탕색이라 지나가는 선을 끊어 준다.
 * 숙소 · 공항 · 항공편은 15 잉크, 임시는 바탕색 + 점선 테두리
 */
const PLAN: Record<Exclude<StopKind, "place">, string> = {
  hub: "size-3.75 border-[2.5px] border-surface-sunken bg-ink-900",
  opt: "size-3.25 border-2 border-dashed border-route-stop-opt bg-surface-sunken",
};

/** 기록 모드 표식 · 패스 */
const RECORD: Record<Exclude<StopTone, "plan" | "visited">, string> = {
  done: "size-4.5 border-[2.5px] border-surface-sunken bg-visited",
  current: "size-4 border-4 border-visited bg-white shadow-[0_0_0_4px_rgba(16,185,129,.2)]",
  todo: "size-2.75 border-2 border-surface-sunken bg-route-stop-todo",
  pass: "size-3.25 border-[2.5px] border-surface-sunken bg-pass-strong",
};

/** 표식 안 글자 — 다녀옴 「✓」 · 패스 「–」 */
const MARK: Partial<Record<StopTone, string>> = { visited: "✓", done: "✓", pass: "–" };

type StopMarkerProps = {
  kind: StopKind;
  tone: StopTone;
  /** 일반 장소의 채움 색 */
  category: PlaceCategory | null;
  className?: string;
};

/** 계획 모드 다녀옴 — 17 카테고리 색(숙소 · 공항은 잉크) + ✓ */
function visitedClass(kind: StopKind, category: PlaceCategory | null): string {
  const fill = kind === "place" && category ? CATEGORY_FILL[category] : "bg-ink-900";
  return cn("size-4.25 border-[2.5px] border-surface-sunken", fill);
}

/** 표식 모양 — 계획(수단 · 카테고리) · 계획의 다녀옴 · 기록 · 패스 */
function markerClass(tone: StopTone, kind: StopKind, category: PlaceCategory | null): string {
  if (tone === "plan") return planClass(kind, category);
  if (tone === "visited") return visitedClass(kind, category);
  return RECORD[tone];
}

/** 계획 모드 표식 — 일반 장소는 13 카테고리 색 점 */
function planClass(kind: StopKind, category: PlaceCategory | null): string {
  if (kind !== "place") return PLAN[kind];
  return cn(
    "size-3.25 border-[2.5px] border-surface-sunken",
    category ? CATEGORY_FILL[category] : "bg-cat-etc",
  );
}

/** 노선도의 역 표식(색 점). 다녀온 역은 ✓(기록 모드는 초록 채움), 패스는 회색 채움 + 「–」 */
export function StopMarker({ kind, tone, category, className }: StopMarkerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-[9px]/none font-black text-white",
        markerClass(tone, kind, category),
        className,
      )}
    >
      {MARK[tone]}
    </span>
  );
}
