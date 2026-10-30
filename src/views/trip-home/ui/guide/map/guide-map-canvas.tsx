"use client";

import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import { fitZoom, MapPin, pinAnchor } from "@/entities/schedule-item";

import {
  corePoints,
  freeCenterOffset,
  type GuidePin,
  type LatLng,
  mapPadding,
  sheetHeight,
  type SheetStage,
  stageHeight,
} from "../../../lib/guide-map";

/** 첫 화면 줌 상한 — 한 동네만 있어도 너무 당겨지지 않게 */
const MAX_ZOOM = 16;
/** 핀이 하나도 없을 때의 중심(도쿄역) */
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 };

type GuideMapCanvasProps = {
  pins: GuidePin[];
  selectedId: string | null;
  layout: "mobile" | "pc";
  /** 모바일 시트 단계 — 고른 핀을 시트 위 칸 가운데로 옮긴다(펼친 동안은 옮기지 않는다). PC 는 null */
  sheetStage: SheetStage | null;
  onSelect: (placeId: string) => void;
  /** 지도 빈 곳을 눌렀다 — 상세를 닫는다 */
  onBackground: () => void;
};

/**
 * 가이드 지도 — 번호 핀(일정에 넣은 곳은 파랑 채움, 식당은 배지). 고른 핀은 강조 핀 + 아래 잉크 이름표.
 * 처음 · 필터가 바뀔 때 핀을 맞추고(가운데에서 12km 안만), 고르면 그 핀을 시트 · 패널에 가리지 않는 칸 가운데로 옮긴다.
 * AdvancedMarker 라 NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID 가 필요하다. 컨테이너가 isolation 으로 쌓임 맥락을 가둔다
 */
export function GuideMapCanvas({
  pins,
  selectedId,
  layout,
  sheetStage,
  onSelect,
  onBackground,
}: GuideMapCanvasProps) {
  const selected = pins.find((p) => p.card.place.id === selectedId) ?? null;
  return (
    <Map
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
      defaultCenter={pins[0]?.at ?? DEFAULT_CENTER}
      defaultZoom={13}
      gestureHandling="greedy"
      disableDefaultUI
      clickableIcons={false}
      onClick={onBackground}
      className="size-full"
    >
      {pins.map((pin) => {
        const focus = pin.card.place.id === selectedId;
        return (
          <AdvancedMarker
            key={pin.card.place.id}
            position={pin.at}
            title={pin.card.place.name}
            onClick={() => onSelect(pin.card.place.id)}
            zIndex={focus ? 10 : 1}
            {...pinAnchor(focus)}
          >
            <span className="relative block">
              <MapPin
                num={pin.num}
                status={pin.card.day !== null ? "ok" : null}
                category={pin.card.place.category === "food" ? "food" : null}
                focus={focus}
              />
              {focus && (
                <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-pill-sm bg-ink-900 px-1.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-white shadow-[0_1px_4px_rgba(0,0,0,.2)]">
                  {pin.card.place.name}
                </span>
              )}
            </span>
          </AdvancedMarker>
        );
      })}
      <FitGuidePins points={pins.map((p) => p.at)} layout={layout} />
      <PanToSelected at={selected?.at ?? null} layout={layout} stage={sheetStage} />
    </Map>
  );
}

type FitGuidePinsProps = { points: LatLng[]; layout: "mobile" | "pc" };

/**
 * 핀이 바뀌면(처음 · 필터 · 정렬) 가운데 무리를 가리지 않는 칸에 맞춘다. 줌이 상한을 넘으면(한 동네) 가운데 + 상한으로.
 * 맞출 줌을 직접 계산해서(fitZoom) fitBounds 결과를 기다리지 않는다
 */
function FitGuidePins({ points, layout }: FitGuidePinsProps) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map || points.length === 0) return;
    const core = corePoints(points);
    const bounds = new google.maps.LatLngBounds();
    core.forEach((p) => bounds.extend(p));
    const div = map.getDiv();
    // 처음 맞출 때는 시트가 반 단계라고 본다
    const pad = mapPadding(layout, sheetHeight(div.clientHeight));
    const width = Math.max(div.clientWidth - pad.left - pad.right, 1);
    const height = Math.max(div.clientHeight - pad.top - pad.bottom, 1);
    if (fitZoom(core, width, height, 0) >= MAX_ZOOM) {
      map.setZoom(MAX_ZOOM);
      map.setCenter(bounds.getCenter());
      map.panBy(...freeCenterOffset(pad));
      return;
    }
    map.fitBounds(bounds, pad);
    // points 배열은 렌더마다 새로 만들어져 내용(key)으로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, layout]);
  return null;
}

type PanToSelectedProps = { at: LatLng | null; layout: "mobile" | "pc"; stage: SheetStage | null };

/**
 * 고른 핀이 바뀌거나 시트 단계가 바뀌면 줌은 그대로 두고 그 핀을 가리지 않는 칸 가운데로 옮긴다. 좌표 값으로 비교한다.
 * 시트가 덮는 높이는 단계로 정하고 위에 120 은 남긴다. 시트를 펼친 동안은 지도가 가려져 옮기지 않는다
 */
function PanToSelected({ at, layout, stage }: PanToSelectedProps) {
  const map = useMap();
  const key = at ? `${at.lat},${at.lng}` : null;
  useEffect(() => {
    if (!map || !at || stage === "full") return;
    const h = map.getDiv().clientHeight;
    const cover = stage ? Math.min(stageHeight(stage, h), h - 120) : 0;
    map.setCenter(at);
    map.panBy(...freeCenterOffset(mapPadding(layout, cover)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, stage]);
  return null;
}
