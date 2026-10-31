import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import { fitZoom } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

type LatLng = { lat: number; lng: number };

/** 핀을 맞출 때 둘레 여백 · 줌 상한 */
const FIT_PADDING = 40;
const MAX_ZOOM = 16;

/** 이름표 색 — 지금 장소는 잉크, 대체 장소는 흰 바탕, 앞뒤 일정은 흰 바탕 · 회색 글자 */
const LABEL_TONE = {
  ink: "bg-ink-900 text-white",
  plain: "bg-white text-ink-700",
  muted: "bg-white text-ink-500",
} as const;

type LabeledProps = {
  label: string;
  tone?: keyof typeof LABEL_TONE;
  children: React.ReactNode;
};

/** 핀 아래 8px 이름표(11/800 · r6) */
export function Labeled({ label, tone = "plain", children }: LabeledProps) {
  return (
    <span className="relative block">
      {children}
      <span
        className={cn(
          "absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-pill-sm px-1.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap shadow-[0_1px_4px_rgba(0,0,0,.2)]",
          LABEL_TONE[tone],
        )}
      >
        {label}
      </span>
    </span>
  );
}

type FitAllProps = { points: LatLng[] };

/** 핀이 바뀌면(대체 장소를 더하거나 뺌) 모두 보이게. 줌이 상한을 넘으면 가운데 + 상한 */
export function FitAll({ points }: FitAllProps) {
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
export function PanTo({ at, fallback }: PanToProps) {
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
