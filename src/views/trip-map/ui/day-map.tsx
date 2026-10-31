"use client";

import { decode } from "@googlemaps/polyline-codec";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import { itemCoords, itemName, placeNumbers, type ScheduleItem } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { MapGuard } from "@/shared/ui/map-guard";

type Props = {
  items: ScheduleItem[];
  polyline?: string | null;
  selectedId?: string | null;
  onSelect?: (item: ScheduleItem) => void;
  className?: string;
};

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 도쿄역

export function DayMap({ items, polyline, selectedId, onSelect, className }: Props) {
  // 핀은 번호가 붙는 장소(좌표 있는 place)에만. 번호는 타임라인과 같은 계산을 쓴다
  const numbers = placeNumbers(items);
  const located = items.flatMap((it) => {
    const at = numbers.has(it.id) ? itemCoords(it) : null;
    return at ? [{ item: it, at }] : [];
  });
  return (
    <div className={cn("relative size-full", className)}>
      <MapGuard>
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          defaultCenter={located[0]?.at ?? DEFAULT_CENTER}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          className="size-full"
        >
          {located.map(({ item: it, at }) => (
            <AdvancedMarker
              key={it.id}
              position={at}
              title={itemName(it)}
              onClick={() => onSelect?.(it)}
              zIndex={selectedId === it.id ? 10 : 1}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md",
                  selectedId === it.id
                    ? "scale-125 bg-foreground text-background"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {numbers.get(it.id)}
              </div>
            </AdvancedMarker>
          ))}
          <FitBounds points={located.map((l) => l.at)} />
          <RoutePolyline encoded={polyline ?? null} />
        </Map>
      </MapGuard>
    </div>
  );
}

type FitBoundsProps = { points: { lat: number; lng: number }[] };

function FitBounds({ points }: FitBoundsProps) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

type RoutePolylineProps = { encoded: string | null };

/** vis.gl 에는 Polyline 컴포넌트가 없어 직접 생성/정리 */
function RoutePolyline({ encoded }: RoutePolylineProps) {
  const map = useMap();
  useEffect(() => {
    if (!map || !encoded) return;
    const path = decode(encoded).map(([lat, lng]) => ({ lat, lng }));
    const line = new google.maps.Polyline({
      path,
      map,
      strokeColor: "#2563eb",
      strokeOpacity: 0.85,
      strokeWeight: 4,
    });
    return () => line.setMap(null);
  }, [map, encoded]);
  return null;
}
