"use client";

import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { Maximize2 } from "lucide-react";

import {
  itemName,
  MapPin,
  pinAnchor,
  type PlaceCategory,
  type ReservationStatus,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { AltPin, NeighborPin } from "../lib/alt-map";
import { FitAll, Labeled, PanTo } from "./alternatives-map-parts";

type LatLng = { lat: number; lng: number };

type AlternativesMapProps = {
  /** 지금 장소 — 일정의 번호 핀 그대로(번호 · 예약 상태 · 카테고리) */
  current: {
    at: LatLng;
    num: number | null;
    status: ReservationStatus | null;
    category: PlaceCategory | null;
  };
  pins: AltPin[];
  /** 고른 대체 장소 id. null 이면 지금 장소가 강조된다 */
  selectedId: string | null;
  onSelect: (altId: string | null) => void;
  /** 같은 날 바로 앞 · 뒤 일정(흰 번호 핀 + 회색 이름표). 미니 지도는 비운다 — 작은 지도가 복잡해진다 */
  neighbors?: NeighborPin[];
  /** 크게 보기 창 안 — 창을 꽉 채우고 한 손가락으로도 움직인다 */
  expanded?: boolean;
  /** 오른쪽 위 「크게 보기」. 없으면 버튼을 그리지 않는다 */
  onExpand?: () => void;
};

/**
 * 대체 장소 지도 — 지금 장소 핀 + 잉크 「지금」, 대체 장소는 점선 핀 A · B · C + 흰 이름표, 크게 보기에서는 앞뒤 일정 핀도.
 * 처음엔 핀을 모두 맞추고(여백 40 · 줌 상한 16), 고르면 그 핀을 강조하고 그쪽으로 옮긴다.
 * 미니 지도(180 · r12)는 상세 창 안이라 스크롤을 가로채지 않게 휠 · 한 손가락 끌기로는 움직이지 않는다(cooperative). 줌 버튼은 없다
 */
export function AlternativesMap({
  current,
  pins,
  selectedId,
  onSelect,
  neighbors = [],
  expanded = false,
  onExpand,
}: AlternativesMapProps) {
  const selected = pins.find((p) => p.alt.id === selectedId) ?? null;
  return (
    <div
      className={cn(
        "relative isolate z-0 overflow-hidden bg-map-bg",
        expanded ? "size-full" : "h-45 rounded-card border border-line-card",
      )}
    >
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        defaultCenter={current.at}
        defaultZoom={15}
        gestureHandling={expanded ? "greedy" : "cooperative"}
        disableDefaultUI
        clickableIcons={false}
        className="size-full"
      >
        {neighbors.map((n) => (
          <AdvancedMarker
            key={n.id}
            position={n.at}
            title={n.label}
            zIndex={0}
            {...pinAnchor(false)}
          >
            <Labeled label={n.label} tone="muted">
              <MapPin num={n.num} status={null} category={n.category} />
            </Labeled>
          </AdvancedMarker>
        ))}
        <AdvancedMarker
          position={current.at}
          title="지금 장소"
          onClick={() => onSelect(null)}
          zIndex={selected ? 5 : 10}
          {...pinAnchor(selected === null)}
        >
          <Labeled label="지금" tone="ink">
            <MapPin
              num={current.num ?? ""}
              status={current.status}
              category={current.category}
              focus={selected === null}
            />
          </Labeled>
        </AdvancedMarker>
        {pins.map((pin) => {
          const focus = pin.alt.id === selectedId;
          return (
            <AdvancedMarker
              key={pin.alt.id}
              position={pin.at}
              title={itemName(pin.alt)}
              onClick={() => onSelect(pin.alt.id)}
              zIndex={focus ? 10 : 1}
              {...pinAnchor(focus)}
            >
              <Labeled label={itemName(pin.alt)}>
                <MapPin num={pin.tag} status="opt" category={null} focus={focus} />
              </Labeled>
            </AdvancedMarker>
          );
        })}
        <FitAll points={[current.at, ...pins.map((p) => p.at), ...neighbors.map((n) => n.at)]} />
        <PanTo at={selected?.at ?? null} fallback={current.at} />
      </Map>
      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute top-2 right-2 z-10 flex h-8 items-center gap-1 rounded-button bg-white px-2.5 text-xs font-bold text-ink-700 shadow-[0_1px_4px_rgba(0,0,0,.2)]"
        >
          <Maximize2 className="size-3.5" />
          크게 보기
        </button>
      )}
    </div>
  );
}
