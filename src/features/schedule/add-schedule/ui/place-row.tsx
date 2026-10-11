import { Check, Loader2 } from "lucide-react";

import { CategoryThumb, type PlaceCategory } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

type PlaceRowProps = {
  name: string;
  category: PlaceCategory | null;
  /** 둘째 줄(카테고리 · 지역 / 구글 주소) */
  meta: string | null;
  rating?: number | null;
  description?: string | null;
  /** 둘째 줄 앞의 틸 배지(「내 숙소 · 10.31–11.1」) */
  tag?: string | null;
  /** 셋째 줄 끝의 회색 덧붙임(「이 날 2번 있음」) */
  note?: string | null;
  /** 여행 일정에 이미 있는 장소(날짜 무관) */
  inTrip: boolean;
  chosen: boolean;
  /** 고르는 중(상세를 받는 중). 오른쪽에 로딩 표시 */
  busy?: boolean;
  onToggle: () => void;
};

/**
 * 장소 한 줄: 56 썸네일 · 이름 16/700 + 「일정에 있음」 · 둘째 줄(틸 배지 + 메타) · ★ 별점 + 설명 + 회색 덧붙임 · 오른쪽 「선택」/파란 체크.
 * 줄 전체가 고르기 버튼이다.
 */
export function PlaceRow({
  name,
  category,
  meta,
  rating,
  description,
  tag,
  note,
  inTrip,
  chosen,
  busy,
  onToggle,
}: PlaceRowProps) {
  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-3 text-left",
        chosen ? "bg-surface-memo" : "bg-white",
      )}
    >
      <CategoryThumb category={category} size="lg" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.75">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-base font-bold tracking-[-0.01em] text-ink-900">
            {name}
          </span>
          {inTrip && (
            <span className="shrink-0 rounded-tag bg-status-ok-bg px-1.5 py-0.5 text-[11px] font-bold text-status-ok">
              일정에 있음
            </span>
          )}
        </span>
        <MetaLine tag={tag} meta={meta} />
        <ExtraLine rating={rating} description={description} note={note} />
      </span>
      <Toggle busy={busy} chosen={chosen} />
    </button>
  );
}

type MetaLineProps = { tag?: string | null; meta: string | null };

/** 둘째 줄 — 틸 배지 + 메타. 둘 다 없으면 그리지 않는다 */
function MetaLine({ tag, meta }: MetaLineProps) {
  if (!tag && !meta) return null;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {tag && (
        <span className="flex h-5 shrink-0 items-center rounded-[5px] bg-cat-stay-soft px-1.75 text-[11px] font-extrabold whitespace-nowrap text-tag-hours">
          {tag}
        </span>
      )}
      {meta && <span className="truncate text-[13px] text-ink-400">{meta}</span>}
    </span>
  );
}

type ExtraLineProps = {
  rating?: number | null;
  description?: string | null;
  note?: string | null;
};

/** 셋째 줄 — ★ 별점 · 설명 · 회색 덧붙임. 다 없으면 그리지 않는다 */
function ExtraLine({ rating, description, note }: ExtraLineProps) {
  if (rating == null && !description && !note) return null;
  return (
    <span className="flex min-w-0 gap-1.5 text-[13px]">
      {rating != null && (
        <span className="shrink-0 font-bold text-star">★ {rating.toFixed(1)}</span>
      )}
      {description && <span className="truncate text-ink-500">{description}</span>}
      {note && <span className="shrink-0 text-ink-350">· {note}</span>}
    </span>
  );
}

type ToggleProps = { busy?: boolean; chosen: boolean };

/** 오른쪽 — 받는 중이면 로딩, 골랐으면 파란 체크, 아니면 「선택」 */
function Toggle({ busy, chosen }: ToggleProps) {
  if (busy) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center text-ink-400">
        <Loader2 className="size-4.5 animate-spin" aria-label="불러오는 중" />
      </span>
    );
  }
  if (chosen) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Check className="size-4.5" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="flex h-8 shrink-0 items-center rounded-full border border-line-strong px-3 text-[13px] font-bold text-ink-700">
      선택
    </span>
  );
}
