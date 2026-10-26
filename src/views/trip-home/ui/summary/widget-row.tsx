import { ChevronRight, Clock, Coins, type LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

import type { WidgetTile } from "../../lib/widgets";

const ICON: Record<WidgetTile["key"], LucideIcon> = { rate: Coins, time: Clock };

type TileProps = {
  tile: WidgetTile;
  onOpen?: () => void;
  className: string;
  children: React.ReactNode;
};

/** 타일 껍데기 — 누를 수 있으면(환율 → 계산기) 버튼, 아니면 칸 */
function Tile({ tile, onOpen, className, children }: TileProps) {
  if (!onOpen) return <div className={className}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${tile.label} 계산기 열기`}
      className={cn(className, "cursor-pointer text-left")}
    >
      {children}
    </button>
  );
}

type WidgetRowProps = {
  tiles: WidgetTile[];
  layout: "mobile" | "pc";
  /** 환율 타일을 누르면 — 계산기 */
  onOpenRate: () => void;
};

/**
 * 현지 정보 위젯 줄. 모바일은 회색 타일(76 · r12)을 나란히, PC 는 흰 카드 한 장을 세로선으로 나눈 칸(아이콘 칸 36 · 값 옆 보조).
 * 환율 타일만 누를 수 있다(계산기)
 */
export function WidgetRow({ tiles, layout, onOpenRate }: WidgetRowProps) {
  const openOf = (t: WidgetTile) => (t.key === "rate" ? onOpenRate : undefined);
  if (layout === "mobile") {
    return (
      <div className="flex gap-2 px-5 pt-3 pb-3.5">
        {tiles.map((t) => {
          const Icon = ICON[t.key];
          return (
            <Tile
              key={t.key}
              tile={t}
              onOpen={openOf(t)}
              className="flex h-19 min-w-0 flex-1 flex-col gap-0.5 rounded-card bg-surface-sunken px-3 py-2.5"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap text-ink-400">
                <Icon className="size-3.25" aria-hidden="true" />
                {t.label}
              </span>
              <span className="truncate text-base font-extrabold text-ink-900">{t.main}</span>
              <span className="truncate text-[11px] text-ink-400">{t.sub}</span>
            </Tile>
          );
        })}
      </div>
    );
  }
  return (
    <div className="mx-10 mt-3.5 mb-4 flex overflow-hidden rounded-card border border-line-card bg-white shadow-[0_1px_6px_rgba(0,0,0,.05)]">
      {tiles.map((t, i) => {
        const Icon = ICON[t.key];
        const open = openOf(t);
        return (
          <Tile
            key={t.key}
            tile={t}
            onOpen={open}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5",
              i > 0 && "border-l border-surface-muted",
              open && "hover:bg-surface-sunken",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-memo bg-surface-muted">
              <Icon className="size-4.5 text-ink-500" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs font-bold whitespace-nowrap text-ink-400">{t.label}</span>
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="text-[17px] font-extrabold whitespace-nowrap text-ink-900">
                  {t.main}
                </span>
                <span className="truncate text-xs text-ink-400">{t.sub}</span>
              </span>
            </span>
            {open && <ChevronRight className="size-4 shrink-0 text-handle" aria-hidden="true" />}
          </Tile>
        );
      })}
    </div>
  );
}
