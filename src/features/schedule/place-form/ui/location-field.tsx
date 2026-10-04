"use client";

import { Map, useMap } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

import { type LatLng, samePoint } from "../lib/place-form";
import type { PlaceFormState } from "../model/use-place-form";
import { Field } from "./form-parts";

type LocationFieldProps = { form: PlaceFormState };

/**
 * 위치: 검색(같은 도시 제한 구글 검색) → 고르면 핀이 그곳으로, 또는 지도를 움직여 중앙 핀을 맞춘다.
 * 시안의 지역 칩은 지역 좌표 데이터가 없어 넣지 않았다(#76).
 * 지도 컨테이너는 isolation 으로 쌓임 맥락을 가둬 지도 패널이 다이얼로그 위로 올라오지 않게 한다.
 */
export function LocationField({ form }: LocationFieldProps) {
  const { values, suggestions } = form;
  const at = values.at;
  return (
    <Field label="위치" aside={at ? `${at.lat.toFixed(4)}, ${at.lng.toFixed(4)}` : "위치 없음"}>
      <label className="flex h-10.5 items-center gap-2 rounded-card bg-surface-muted px-3">
        <Search className="size-4.5 shrink-0 text-ink-400" />
        <input
          value={form.locationQuery}
          onChange={(e) => form.setLocationQuery(e.target.value)}
          placeholder="장소 · 역 이름으로 이동 (예: 시부야)"
          aria-label="위치 검색"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none"
        />
      </label>
      {suggestions.suggestions.length > 0 && (
        <ul className="flex flex-col divide-y divide-divider rounded-card border border-line">
          {suggestions.suggestions.slice(0, 5).map((s, i) => {
            const p = s.placePrediction;
            if (!p) return null;
            return (
              <li key={p.placeId || i}>
                <button
                  type="button"
                  onClick={() => void form.pickLocation(s)}
                  className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left"
                >
                  <span className="truncate text-sm font-bold text-ink-900">
                    {p.mainText?.text}
                  </span>
                  <span className="truncate text-xs text-ink-400">{p.secondaryText?.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {form.mapCenter ? (
        <div className="relative isolate h-50 overflow-hidden rounded-card border border-line bg-map-bg">
          <Map
            defaultCenter={form.mapCenter}
            defaultZoom={at ? 15 : 13}
            gestureHandling="greedy"
            // 화살표 키 이동은 끌기(dragstart)로 잡히지 않아 핀으로 되돌아간다. 키보드로는 위 검색으로 위치를 정한다
            keyboardShortcuts={false}
            disableDefaultUI
            clickableIcons={false}
            className="size-full"
          >
            <CenterSync at={at} onMove={form.moveTo} />
          </Map>
          {/* 중앙 핀: 아래 끝이 지도 중앙에 닿는 파란 물방울. 위치를 정하기 전엔 흐리게 */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full",
              !at && "opacity-40",
            )}
          >
            <span className="block size-7.5 -rotate-45 rounded-[50%_50%_50%_0] border-2 border-white bg-primary shadow-[0_2px_6px_rgba(0,0,0,.3)]" />
          </span>
          <span className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex h-7.5 items-center justify-center rounded-button bg-white/95 text-xs font-semibold text-ink-700">
            {at ? "지도를 움직여 핀 위치를 맞춰 주세요" : "지도를 움직이면 핀 위치로 저장돼요"}
          </span>
        </div>
      ) : (
        <p className="rounded-card bg-surface-muted px-3.5 py-3 text-[13px] text-ink-500">
          여행에 도시가 없어 지도를 띄울 수 없어요. 위에서 검색해 위치를 고르거나, 위치 없이 담을 수
          있어요.
        </p>
      )}
    </Field>
  );
}

type CenterSyncProps = {
  /** 폼의 핀 위치. 지도 중심과 다르면 지도를 그곳으로 옮긴다(검색으로 고를 때 — 같은 곳을 다시 골라도) */
  at: LatLng | null;
  /** 사용자가 지도를 끌어 옮기면 새 중앙으로 부른다 */
  onMove: (at: LatLng) => void;
};

/** 위치를 고르면 이만큼은 확대해 보인다 */
const PICKED_ZOOM = 15;

/**
 * 지도와 폼의 핀 위치를 맞춘다. 지도가 멈출 때(idle)만 중앙을 읽어 이동 중에 폼을 흔들지 않는다.
 * - 끌기(dragstart 뒤 idle)만 위치를 바꾼다. 휠 · 핀치 · 더블클릭 확대는 커서 쪽으로 중심을 옮기는데,
 *   그걸 위치 변경으로 받으면 확대만 해도 고른 구글 장소가 지워진다. 그래서 확대 · 축소로 중심이 밀리면 핀 위치로 되돌린다
 * - 위치가 비어 있으면 되돌릴 곳이 없어 그대로 둔다(첫 idle 로 좌표가 채워지지 않는다)
 */
function CenterSync({ at, onMove }: CenterSyncProps) {
  const map = useMap();
  const atRef = useRef(at);
  useEffect(() => {
    atRef.current = at;
    if (!map || !at) return;
    const c = map.getCenter();
    // 끌어서 바뀐 위치는 이미 지도 중심이라 건너뛴다 — 검색으로 고른 곳으로 옮길 때만 확대도 맞춘다
    if (c && samePoint({ lat: c.lat(), lng: c.lng() }, at)) return;
    map.panTo(at);
    if ((map.getZoom() ?? 0) < PICKED_ZOOM) map.setZoom(PICKED_ZOOM);
  }, [map, at]);
  useEffect(() => {
    if (!map) return;
    let dragged = false;
    const drag = map.addListener("dragstart", () => {
      dragged = true;
    });
    const idle = map.addListener("idle", () => {
      const c = map.getCenter();
      if (!c) return;
      const now = { lat: c.lat(), lng: c.lng() };
      const pin = atRef.current;
      if (dragged) {
        dragged = false;
        if (!(pin && samePoint(now, pin))) onMove(now);
      } else if (pin && !samePoint(now, pin)) {
        map.panTo(pin);
      }
    });
    return () => {
      drag.remove();
      idle.remove();
    };
  }, [map, onMove]);
  return null;
}
