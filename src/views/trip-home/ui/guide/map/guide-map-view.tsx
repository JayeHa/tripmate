"use client";

import { useState } from "react";

import type { GuideCard } from "../../../lib/guide";
import { guidePins, nearbyPins } from "../../../lib/guide-map";
import type { GuideActions } from "../../../model/use-guide-actions";
import { useMapSheet } from "../../../model/use-map-sheet";
import { GuideMapCanvas } from "./guide-map-canvas";
import { GuideMapDetail } from "./guide-map-detail";
import { GuideMapList } from "./guide-map-list";
import { GuideMapSheet } from "./guide-map-sheet";

type GuideMapViewProps = {
  /** 필터 · 정렬을 건 카드 — 핀 번호가 이 순서를 따른다 */
  cards: GuideCard[];
  layout: "mobile" | "pc";
  a: GuideActions;
};

/**
 * 가이드 「지도」 보기 — 필터 줄 아래부터 화면 끝까지 지도, 그 위에 장소 목록 · 상세.
 * 모바일은 아래 시트(접힘 · 반 · 펼침, 끌어서 바꾼다), PC 는 왼쪽 패널(380). 핀이나 줄을 고르면 상세(모바일은 반 단계로),
 * 지도 빈 곳 · 「‹ 목록」 은 목록으로. 상세 아래 「근처 다른 장소」 3곳을 누르면 그 장소로.
 * 「+ 일정」 · 「수정」 은 목록 보기와 같은 창(날짜 고르기 · 장소 정보 수정)을 연다.
 * data-guide-map 이 있으면 홈 화면이 높이를 화면에 맞춘다(지도가 남은 칸을 채우게)
 */
export function GuideMapView({ cards, layout, a }: GuideMapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { stage, setStage, dragHeight, measure, startDrag, tapHandle } = useMapSheet();
  const mobile = layout === "mobile";
  const { pins, noLocation } = guidePins(cards);
  // 필터가 바뀌어 고른 장소가 빠지면 목록으로 돌아간다
  const selected = pins.find((p) => p.card.place.id === selectedId) ?? null;

  /** 핀 · 목록 줄에서 고른다 — 모바일은 반 단계로(지도와 상세를 함께 보게) */
  function pick(placeId: string) {
    setSelectedId(placeId);
    if (mobile) setStage("half");
  }

  const drag = mobile ? startDrag : undefined;
  const body = selected ? (
    <GuideMapDetail
      pin={selected}
      nearby={nearbyPins(pins, selected)}
      onBack={() => setSelectedId(null)}
      onPick={setSelectedId}
      onAdd={a.day.ask}
      onEdit={selected.card.place.created_by === a.myId ? a.edit.ask : null}
      onHeadPointerDown={drag}
    />
  ) : (
    <GuideMapList pins={pins} noLocation={noLocation} onPick={pick} onHeadPointerDown={drag} />
  );
  const scrollKey = selected?.card.place.id ?? "list";

  return (
    <div
      data-guide-map
      ref={measure}
      className="relative isolate z-0 min-h-0 flex-1 border-t border-divider bg-map-bg"
    >
      <GuideMapCanvas
        pins={pins}
        selectedId={selected?.card.place.id ?? null}
        layout={layout}
        sheetStage={mobile ? stage : null}
        onSelect={pick}
        onBackground={() => setSelectedId(null)}
      />
      {mobile ? (
        <GuideMapSheet
          stage={stage}
          dragHeight={dragHeight}
          onHandleDown={startDrag}
          onHandleTap={tapHandle}
          onShowMap={() => setStage("half")}
          scrollKey={scrollKey}
        >
          {body}
        </GuideMapSheet>
      ) : (
        <div className="absolute inset-y-4 left-4 z-10 flex w-95 flex-col overflow-hidden rounded-card bg-white shadow-[0_6px_20px_rgba(0,0,0,.12)]">
          {/* 고른 장소가 바뀌면 스크롤을 맨 위로 — 스크롤 칸을 새로 그린다 */}
          <div key={scrollKey} className="min-h-0 flex-1 overflow-y-auto pt-3">
            {body}
          </div>
        </div>
      )}
    </div>
  );
}
