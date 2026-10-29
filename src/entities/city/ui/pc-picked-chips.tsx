import { X } from "lucide-react";

import type { City } from "../model/types";
import { CityThumb } from "./city-thumb";

const CHIP = "flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-muted pl-1";

type PcPickedChipsProps = {
  picked: City[];
  /** 없으면 읽기 전용 칩 */
  onRemove?: (city: City) => void;
};

/** PC 바닥의 고른 도시 칩. onRemove 가 있으면 눌러서 뺀다 */
export function PcPickedChips({ picked, onRemove }: PcPickedChipsProps) {
  if (picked.length === 0) {
    return <span className="text-[13px] text-ink-350">도시를 1개 이상 골라 주세요</span>;
  }
  return picked.map((city) =>
    onRemove ? (
      <button
        key={city.id}
        type="button"
        onClick={() => onRemove(city)}
        aria-label={`${city.name} 빼기`}
        className={`${CHIP} pr-2`}
      >
        <ChipLabel city={city} />
        <X className="size-3.5 text-ink-450" strokeWidth={2.4} />
      </button>
    ) : (
      <span key={city.id} className={`${CHIP} pr-2.5`}>
        <ChipLabel city={city} />
      </span>
    ),
  );
}

type ChipLabelProps = { city: City };

/** 칩 안 — 도시 사진 24 · 이름 */
function ChipLabel({ city }: ChipLabelProps) {
  return (
    <>
      <CityThumb city={city} size={24} />
      <span className="text-[13px] font-bold text-ink-800">{city.name}</span>
    </>
  );
}
