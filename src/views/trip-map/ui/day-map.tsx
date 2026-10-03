"use client";

import { decode } from "@googlemaps/polyline-codec";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import type { ScheduleItem } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

type Props = {
  items: ScheduleItem[];
  polyline?: string | null;
  selectedId?: string | null;
  onSelect?: (item: ScheduleItem) => void;
  className?: string;
};

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 도쿄역

export function DayMap({ items, polyline, selectedId, onSelect, className }: Props) {
  const located = items.filter((it) => it.lat != null && it.lng != null);
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        defaultCenter={located[0] ? { lat: located[0].lat!, lng: located[0].lng! } : DEFAULT_CENTER}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        className="h-full w-full"
      >
        {located.map((it) => (
          <AdvancedMarker
            key={it.id}
            position={{ lat: it.lat!, lng: it.lng! }}
            title={it.name}
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
              {items.indexOf(it) + 1}
            </div>
          </AdvancedMarker>
        ))}
        <FitBounds items={located} />
        <RoutePolyline encoded={polyline ?? null} />
      </Map>
    </div>
  );
}

function FitBounds({ items }: { items: ScheduleItem[] }) {
  const map = useMap();
  const key = items.map((it) => it.id).join("|");
  useEffect(() => {
    if (!map || items.length === 0) return;
    if (items.length === 1) {
      map.setCenter({ lat: items[0].lat!, lng: items[0].lng! });
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    items.forEach((it) => bounds.extend({ lat: it.lat!, lng: it.lng! }));
    map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/** vis.gl 에는 Polyline 컴포넌트가 없어 직접 생성/정리 */
function RoutePolyline({ encoded }: { encoded: string | null }) {
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
