import { ChevronDown, ChevronUp, Link as LinkIcon, MapPin } from "lucide-react";
import { useState } from "react";

import { isHttpUrl, type Place, placeLinksOf } from "@/entities/schedule-item";
import { withKeys } from "@/shared/lib/keys";
import { cn } from "@/shared/lib/utils";

import { type InfoRow, placeInfoRows } from "../lib/detail";
import { RegisterStayNote } from "./register-stay-note";

type PlaceInfoBandProps = {
  place: Place;
  /** 「📍 도쿄 장소」 의 도시 이름. 모르면 「장소」 */
  cityName: string | null;
  /** 그 일정 날의 요일(0 = 일요일). 운영시간은 그날 값을 대표로 */
  dow: number | null;
  /** 「장소 정보 수정」. 장소를 만든 사람이 아니면 null(버튼 숨김 — 장소는 만든 사람만 고친다) */
  onEdit: (() => void) | null;
  /** 「숙소로 등록」 — 숙소에 연결되지 않은 숙소 일정만. 아니면 null(안내 숨김) */
  onRegisterStay: (() => void) | null;
};

/**
 * 장소 정보 띠 — 헤더와 이어지는 연회색 띠에 「📍 도쿄 장소」 칩 · 표(설명 · 주소 · 별점 · 운영시간) · 링크 칩.
 * 다른 일정 · 여행과 함께 쓰는 정보라 「이번 일정」 과 칸을 나눈다. 오른쪽 위 「장소 정보 수정」 은 장소 입력 폼을 연다.
 * 숙소 탭에 없는 숙소 일정이면 칩 줄 아래에 「숙소로 등록」 안내가 붙는다.
 */
export function PlaceInfoBand({
  place,
  cityName,
  dow,
  onEdit,
  onRegisterStay,
}: PlaceInfoBandProps) {
  const rows = placeInfoRows(place, dow);
  const links = [
    ...(isHttpUrl(place.gmap_url) ? [{ title: "구글맵", url: place.gmap_url, gmap: true }] : []),
    ...placeLinksOf({ place }).map((l) => ({ title: l.title || "링크", url: l.url, gmap: false })),
  ];
  return (
    <div className="-mx-5 -mt-4 flex flex-col gap-2.5 border-b border-divider bg-surface-sunken px-5 pb-4.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-5.5 w-fit items-center gap-1 rounded-full bg-tag-link-bg px-2 text-xs font-bold text-ink-600">
          <MapPin className="size-3" />
          {cityName ?? ""} 장소
        </span>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs font-bold text-ink-500">
            장소 정보 수정
          </button>
        )}
      </div>
      {onRegisterStay && <RegisterStayNote onRegister={onRegisterStay} />}
      {rows.map((row) => (
        <PlaceInfoLine key={row.label} row={row} />
      ))}
      {rows.length === 0 && (
        <p className="text-[13px] text-ink-350">설명 · 운영시간이 비어 있어요.</p>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {withKeys(links, (l) => `${l.title}:${l.url}`).map(({ key, value: l }) => (
            <a
              key={key}
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

type PlaceInfoLineProps = { row: InfoRow };

/** 표 한 줄: 라벨 · 값. 운영시간이 요일별이면 「요일별 보기」 로 7일을 펼친다(홈 가이드 상세도 쓴다) */
export function PlaceInfoLine({ row }: PlaceInfoLineProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex gap-3 text-[13px]/normal">
      <span className="w-15 shrink-0 text-ink-400 lg:w-16">{row.label}</span>
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
