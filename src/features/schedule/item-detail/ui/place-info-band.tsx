import { ChevronDown, ChevronUp, Link as LinkIcon, MapPin } from "lucide-react";
import { useState } from "react";

import { isHttpUrl, type Place, placeLinksOf } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import { type InfoRow, placeInfoRows } from "../lib/detail";

type PlaceInfoBandProps = {
  place: Place;
  /** 「📍 도쿄 장소」 의 도시 이름. 모르면 「장소」 */
  cityName: string | null;
  /** 그 일정 날의 요일(0 = 일요일). 운영시간은 그날 값을 대표로 */
  dow: number | null;
};

/**
 * 장소 정보 띠 — 헤더와 이어지는 연회색 띠에 「📍 도쿄 장소」 칩 · 표(설명 · 주소 · 별점 · 운영시간) · 링크 칩.
 * 다른 일정 · 여행과 함께 쓰는 정보라 「이번 일정」 과 칸을 나눈다. 「장소 정보 수정」 은 ③-b 에서 붙인다.
 */
export function PlaceInfoBand({ place, cityName, dow }: PlaceInfoBandProps) {
  const rows = placeInfoRows(place, dow);
  const links = [
    ...(isHttpUrl(place.gmap_url) ? [{ title: "구글맵", url: place.gmap_url, gmap: true }] : []),
    ...placeLinksOf({ place }).map((l) => ({ title: l.title || "링크", url: l.url, gmap: false })),
  ];
  return (
    <div className="-mx-5 -mt-4 flex flex-col gap-2.5 border-b border-divider bg-surface-sunken px-5 pb-4.5">
      <span className="flex h-5.5 w-fit items-center gap-1 rounded-full bg-tag-link-bg px-2 text-xs font-bold text-ink-600">
        <MapPin className="size-3" />
        {cityName ?? ""} 장소
      </span>
      {rows.map((row) => (
        <InfoLine key={row.label} row={row} />
      ))}
      {rows.length === 0 && (
        <p className="text-[13px] text-ink-350">설명 · 운영시간이 비어 있어요.</p>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {links.map((l) => (
            <a
              key={`${l.title}-${l.url}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 items-center gap-1.25 rounded-full border border-line bg-white px-2.5 text-xs font-semibold text-ink-700"
            >
              {l.gmap ? (
                <MapPin className="size-3.25 text-ink-500" />
              ) : (
                <LinkIcon className="size-3.25 text-ink-500" />
              )}
              {l.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

type InfoLineProps = { row: InfoRow };

/** 표 한 줄: 라벨 · 값. 운영시간이 요일별이면 「요일별 보기」 로 7일을 펼친다 */
function InfoLine({ row }: InfoLineProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex gap-3 text-[13px]/normal">
      <span className="w-15 shrink-0 text-ink-400">{row.label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={cn(
            "text-pretty whitespace-pre-line",
            row.off ? "font-bold text-destructive" : "text-ink-700",
          )}
        >
          {row.value}
        </span>
        {row.week && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-0.5 self-start text-xs font-bold text-ink-500"
          >
            {open ? "요일별 접기" : "요일별 보기"}
            {open ? <ChevronUp className="size-3.25" /> : <ChevronDown className="size-3.25" />}
          </button>
        )}
        {open && row.week && (
          <span className="text-xs/relaxed whitespace-pre-line text-ink-500">
            {row.week.split(" · ").join("\n")}
          </span>
        )}
      </div>
    </div>
  );
}
