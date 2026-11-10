"use client";

import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import { fitZoom } from "../../lib/map-fit";
import { clampToView, type MapInset, type MapView } from "../../lib/route-map";

type LatLng = { lat: number; lng: number };

/** 가까운 몇 곳으로 너무 확대되지 않게 15 에서 멈춘다(일정 지도와 같다) */
const MAX_ZOOM = 15;
/** 맞출 때 가려진 칸 바깥에 더 두는 여백 */
const FIT_GAP = 24;

/** 좌표 목록 → 비교용 글자 */
function keyOf(points: LatLng[]): string {
  return points.map((p) => `${p.lat},${p.lng}`).join("|");
}

/**
 * 점들을 가려지지 않은 칸 안에 모두 담는다. 한 동네라 15 보다 확대될 때는 가운데 + 15 로 두고,
 * 가려진 칸(위 · 아래)이 다르면 그 차이의 반만큼 지도를 밀어 보이는 칸 가운데에 온다
 */
function fitInside(map: google.maps.Map, points: LatLng[], inset: MapInset) {
  const pad = {
    top: inset.top + FIT_GAP,
    bottom: inset.bottom + FIT_GAP,
    left: inset.side + FIT_GAP,
    right: inset.side + FIT_GAP,
  };
  const bounds = new google.maps.LatLngBounds();
  points.forEach((p) => bounds.extend(p));
  const div = map.getDiv();
  const width = div.clientWidth - pad.left - pad.right;
  const height = div.clientHeight - pad.top - pad.bottom;
  if (fitZoom(points, width, height, 0) >= MAX_ZOOM) {
    map.setCenter(bounds.getCenter());
    map.setZoom(MAX_ZOOM);
    map.panBy(0, (pad.bottom - pad.top) / 2);
    return;
  }
  map.fitBounds(bounds, pad);
}

type RouteCameraProps = {
  /** 맞출 점(범위 안 장소 + 고른 범위 밖 장소) */
  points: LatLng[];
  /** 고른 장소 */
  selected: LatLng | null;
  inset: MapInset;
  /** 지금 보이는 범위. 지도가 아직 범위를 알리지 않았으면 null */
  view: MapView | null;
};

/**
 * 동선 지도의 카메라. 맞출 점이 바뀌면(날 바꾸기 · 범위 밖 장소 고르기) 다시 맞추고,
 * 그 밖에 고른 장소만 바뀌면 가려진 칸 밖일 때만 줌은 그대로 두고 그쪽으로 옮긴다 — 손으로 옮긴 지도를 함부로 되돌리지 않게
 */
export function RouteCamera({ points, selected, inset, view }: RouteCameraProps) {
  const map = useMap();
  const fitted = useRef<string | null>(null);
  const pointsKey = keyOf(points);
  const selectedKey = selected ? keyOf([selected]) : null;
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (fitted.current !== pointsKey) {
      fitted.current = pointsKey;
      fitInside(map, points, inset);
      return;
    }
    if (!selected || !view) return;
    const inside = clampToView(selected, view, inset);
    if (inside.lat === selected.lat && inside.lng === selected.lng) return;
    // 보이는 칸 가운데로 — 가려진 칸 차이의 반만큼 지도 가운데를 아래로
    const latPerPx = (view.north - view.south) / view.height;
    map.panTo({
      lat: selected.lat - ((inset.bottom - inset.top) / 2) * latPerPx,
      lng: selected.lng,
    });
    // view 는 옮기는 동안 계속 바뀐다 — 고른 장소 · 맞출 점이 바뀔 때만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointsKey, selectedKey]);
  return null;
}
