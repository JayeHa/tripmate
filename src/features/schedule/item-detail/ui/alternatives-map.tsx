"use client";

import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import {
  fitZoom,
  itemName,
  MapPin,
  pinAnchor,
  type PlaceCategory,
  type ReservationStatus,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { AltPin } from "../lib/alt-map";

type LatLng = { lat: number; lng: number };

/** 핀을 맞출 때 둘레 여백 · 줌 상한 */
const FIT_PADDING = 40;
const MAX_ZOOM = 16;

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
};

/**
 * 대체 장소 미니 지도(180 · r12) — 지금 장소 핀 + 잉크 「지금」, 대체 장소는 점선 핀 A · B · C + 흰 이름표.
 * 처음엔 핀을 모두 맞추고(여백 40 · 줌 상한 16), 고르면 그 핀을 강조하고 그쪽으로 옮긴다.
 * 상세 창 안의 지도라 스크롤을 가로채지 않게 휠 · 한 손가락 끌기로는 움직이지 않는다(cooperative). 줌 버튼은 없다
 */
export function AlternativesMap({ current, pins, selectedId, onSelect }: AlternativesMapProps) {
  const selected = pins.find((p) => p.alt.id === selectedId) ?? null;
  return (
    <div className="relative isolate z-0 h-45 overflow-hidden rounded-card border border-line-card bg-map-bg">
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        defaultCenter={current.at}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI
        clickableIcons={false}
        className="size-full"
      >
        <AdvancedMarker
          position={current.at}
          title="지금 장소"
          onClick={() => onSelect(null)}
          zIndex={selected ? 5 : 10}
          {...pinAnchor(selected === null)}
        >
          <Labeled label="지금" ink>
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
        <FitAll points={[current.at, ...pins.map((p) => p.at)]} />
        <PanTo at={selected?.at ?? null} fallback={current.at} />
      </Map>
    </div>
  );
}

type LabeledProps = { label: string; ink?: boolean; children: React.ReactNode };

/** 핀 아래 8px 이름표(11/800 · r6) — 지금 장소는 잉크, 대체 장소는 흰 바탕 */
function Labeled({ label, ink = false, children }: LabeledProps) {
  return (
    <span className="relative block">
      {children}
      <span
        className={cn(
          "absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-pill-sm px-1.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap shadow-[0_1px_4px_rgba(0,0,0,.2)]",
          ink ? "bg-ink-900 text-white" : "bg-white text-ink-700",
        )}
      >
        {label}
      </span>
    </span>
  );
}

type FitAllProps = { points: LatLng[] };

/** 핀이 바뀌면(대체 장소를 더하거나 뺌) 모두 보이게. 줌이 상한을 넘으면 가운데 + 상한 */
function FitAll({ points }: FitAllProps) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    const div = map.getDiv();
    if (fitZoom(points, div.clientWidth, div.clientHeight, FIT_PADDING) >= MAX_ZOOM) {
      map.setCenter(bounds.getCenter());
      map.setZoom(MAX_ZOOM);
      return;
    }
    map.fitBounds(bounds, FIT_PADDING);
    // points 배열은 렌더마다 새로 만들어져 내용(key)으로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

type PanToProps = { at: LatLng | null; fallback: LatLng };

/**
 * 고른 핀이 바뀌면 그쪽으로(고른 것을 풀면 지금 장소로) 옮긴다. 지도가 준비된 첫 실행은 건너뛴다 —
 * 처음엔 FitAll 이 핀을 모두 맞춘 화면을 그대로 둔다
 */
function PanTo({ at, fallback }: PanToProps) {
  const map = useMap();
  const readyRef = useRef(false);
  const target = at ?? fallback;
  const key = `${target.lat},${target.lng}`;
  useEffect(() => {
    if (!map) return;
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    map.panTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}
