"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/utils";

import type { GuideCard } from "../../../lib/guide";
import { guidePins } from "../../../lib/guide-map";
import type { GuideActions } from "../../../model/use-guide-actions";
import { GuideMapCanvas } from "./guide-map-canvas";
import { GuideMapDetail } from "./guide-map-detail";
import { GuideMapList } from "./guide-map-list";

type GuideMapViewProps = {
  /** 필터 · 정렬을 건 카드 — 핀 번호가 이 순서를 따른다 */
  cards: GuideCard[];
  layout: "mobile" | "pc";
  a: GuideActions;
};

/**
 * 가이드 「지도」 보기 — 필터 줄 아래부터 화면 끝까지 지도, 그 위에 장소 목록 · 상세.
 * 모바일은 아래 시트(지도 칸의 절반, 최대 300), PC 는 왼쪽 패널(380). 핀이나 줄을 고르면 상세, 지도 빈 곳 · 「‹ 목록」 은 목록으로.
 * 「+ 일정」 · 「수정」 은 목록 보기와 같은 창(날짜 고르기 · 장소 정보 수정)을 연다.
 * data-guide-map 이 있으면 홈 화면이 높이를 화면에 맞춘다(지도가 남은 칸을 채우게)
 */
export function GuideMapView({ cards, layout, a }: GuideMapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { pins, noLocation } = guidePins(cards);
  // 필터가 바뀌어 고른 장소가 빠지면 목록으로 돌아간다
  const selected = pins.find((p) => p.card.place.id === selectedId) ?? null;
  return (
    <div
      data-guide-map
      className="relative isolate z-0 min-h-0 flex-1 border-t border-divider bg-map-bg"
    >
      <GuideMapCanvas
        pins={pins}
        selectedId={selected?.card.place.id ?? null}
        layout={layout}
        onSelect={setSelectedId}
        onBackground={() => setSelectedId(null)}
      />
      <div
        className={cn(
          "absolute z-10 flex flex-col overflow-hidden bg-white",
          layout === "pc"
            ? "inset-y-4 left-4 w-95 rounded-card shadow-[0_6px_20px_rgba(0,0,0,.12)]"
            : "inset-x-0 bottom-0 h-[min(300px,50%)] rounded-t-sheet shadow-sheet",
        )}
      >
        {layout === "mobile" && (
          <div className="flex h-6 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="h-1 w-9 rounded-full bg-line-strong" />
          </div>
        )}
        {/* 고른 장소가 바뀌면 스크롤을 맨 위로 — 스크롤 칸을 새로 그린다 */}
        <div
          key={selected?.card.place.id ?? "list"}
          className={cn("min-h-0 flex-1 overflow-y-auto", layout === "pc" && "pt-3")}
        >
          {selected ? (
            <GuideMapDetail
              pin={selected}
              onBack={() => setSelectedId(null)}
              onAdd={a.day.ask}
              onEdit={selected.card.place.created_by === a.myId ? a.edit.ask : null}
            />
          ) : (
            <GuideMapList pins={pins} noLocation={noLocation} onPick={setSelectedId} />
          )}
        </div>
      </div>
    </div>
  );
}
