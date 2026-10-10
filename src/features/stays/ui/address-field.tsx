import { ChevronRight, MapPin } from "lucide-react";

import type { PickedLocation } from "@/shared/lib/google-places";
import { cn } from "@/shared/lib/utils";

type AddressFieldProps = {
  location: PickedLocation | null;
  onClick: () => void;
};

/** 주소 칸 — 누르면 지도에서 위치를 고른다. 골랐으면 주소(없으면 장소 이름 · 좌표)와 「구글맵 링크 자동 연결됨」 */
export function AddressField({ location, onClick }: AddressFieldProps) {
  const text = location
    ? (location.address ??
      location.name ??
      `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`)
    : "지도에서 위치를 골라 주세요";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-2.5 rounded-memo border border-line px-3.5 py-2.5 text-left hover:bg-surface-sunken"
    >
      <MapPin className="size-4.5 shrink-0 text-brand" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-[15px]/[1.45] font-semibold text-pretty",
            location ? "text-ink-900" : "text-ink-350",
          )}
        >
          {text}
        </span>
        {location && <span className="text-xs text-brand">구글맵 링크 자동 연결됨</span>}
      </span>
      <ChevronRight className="size-4.5 shrink-0 text-ink-350" />
    </button>
  );
}
