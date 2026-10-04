"use client";

import { Map, useMap } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";
import { useEffect } from "react";

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
      {at ? (
        <div className="relative isolate h-50 overflow-hidden rounded-card border border-line bg-map-bg">
          <Map
            defaultCenter={at}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI
            clickableIcons={false}
            className="size-full"
          >
            <CenterSync target={form.mapTarget} onMove={form.moveTo} />
          </Map>
          {/* 중앙 핀: 아래 끝이 지도 중앙에 닿는 파란 물방울 */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full"
          >
            <span className="block size-7.5 -rotate-45 rounded-[50%_50%_50%_0] border-2 border-white bg-primary shadow-[0_2px_6px_rgba(0,0,0,.3)]" />
          </span>
          <span className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex h-7.5 items-center justify-center rounded-button bg-white/95 text-xs font-semibold text-ink-700">
            지도를 움직여 핀 위치를 맞춰 주세요
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
  /** 바뀌면 지도를 그곳으로 옮긴다(검색으로 고를 때) */
  target: { lat: number; lng: number } | null;
  /** 사용자가 지도를 끌어 놓으면 새 중앙으로 부른다 */
  onMove: (at: { lat: number; lng: number }) => void;
};

/** 지도와 폼의 핀 위치를 맞춘다. 끌기가 끝났을 때만 중앙을 읽어 렌더마다 폼을 흔들지 않는다 */
function CenterSync({ target, onMove }: CenterSyncProps) {
  const map = useMap();
  const key = target ? `${target.lat},${target.lng}` : null;
  useEffect(() => {
    if (map && target) map.panTo(target);
    // 좌표 값으로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("dragend", () => {
      const c = map.getCenter();
      if (c) onMove({ lat: c.lat(), lng: c.lng() });
    });
    return () => listener.remove();
  }, [map, onMove]);
  return null;
}
