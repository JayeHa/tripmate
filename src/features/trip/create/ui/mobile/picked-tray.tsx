import { X } from "lucide-react";

import { type City, CityThumb } from "@/entities/city";
import { IconButton } from "@/shared/ui/icon-button";

/** 고른 도시 트레이 (시안 5b). 44px 원 + ✕ 로 빼기 */
export function PickedTray({
  picked,
  onRemove,
}: {
  picked: City[];
  onRemove: (city: City) => void;
}) {
  if (picked.length === 0) return null;
  return (
    <div className="flex gap-3.5 overflow-x-auto pt-1.5">
      {picked.map((city) => (
        <div key={city.id} className="relative flex shrink-0 flex-col items-center gap-1">
          <CityThumb city={city} size={44} />
          <IconButton
            label={`${city.name} 빼기`}
            onClick={() => onRemove(city)}
            className="absolute -top-1.5 -right-2 size-5.5 rounded-full border border-line bg-white text-ink-500"
          >
            <X className="size-3" strokeWidth={2.4} />
          </IconButton>
          <span className="text-xs text-ink-500">{city.name}</span>
        </div>
      ))}
    </div>
  );
}
