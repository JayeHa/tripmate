import { memoParts } from "../../lib/memo-text";
import type { RouteLine } from "../../lib/route-line-style";
import type { TimelineRow } from "../../lib/timeline";
import { itemName } from "../../model/place";
import { RouteLineBar } from "./route-line";

type RouteMemoCardProps = {
  /** 날짜 메모(note) 줄 — 시각(없으면 칸을 비운다) · 글(첫 줄 = 제목, 나머지 = 본문, 앞머리 「★ 」 = 중요) · 홈 고정 */
  row: TimelineRow;
  /** 이 줄을 지나는 구간 선(앞 역 → 다음 역). 첫 역 앞 · 마지막 역 뒤면 null */
  line: RouteLine | null;
  /** 누르면 — 메모 창 */
  onClick: () => void;
};

/**
 * 노선도의 일반 메모 한 줄 — 장소처럼 「시각 48 | 선 28 | 카드」 한 줄을 차지하는 노란 메모지 카드.
 * 시각은 장소보다 흐리게, 선 칸은 그 자리의 구간 선을 끊지 않고 이어 가며 표식은 노란 네모(장소의 동그라미와 구분).
 * 카드는 「📝 메모」(★ 중요 · 「📌 홈 고정」) · 제목(첫 줄) · 본문(나머지, 3줄 말줄임)이고 오른쪽 위 모서리가 접혀 있다
 */
export function RouteMemoCard({ row, line, onClick }: RouteMemoCardProps) {
  const { starred, title, body } = memoParts(itemName(row.item));
  const pinned = row.item.pinned_by !== null;
  return (
    <div className="grid grid-cols-[48px_28px_minmax(0,1fr)]">
      <span className="pt-3.5 pr-1 text-right text-[13px]/4 font-extrabold text-route-card-meta tabular-nums">
        {row.time}
      </span>
      <span className="relative">
        <RouteLineBar line={line} className="inset-y-0" />
        <span
          aria-hidden="true"
          className="absolute top-5.75 left-1/2 z-1 size-4 -translate-1/2 rounded-[5px] border-2 border-surface-sunken bg-memo-mark shadow-[0_0_0_1px_var(--color-memo-mark-ring)]"
        />
      </span>
      <div className="min-w-0 py-1 pl-1">
        <button
          type="button"
          onClick={onClick}
          className="relative flex w-full flex-col gap-2 rounded-card border border-memo-card-line bg-memo-card px-3.25 pt-2.75 pb-3 text-left hover:border-memo-card-hover"
        >
          <span
            aria-hidden="true"
            className="absolute -top-px -right-px size-4 rounded-[0_12px_0_6px] bg-[linear-gradient(225deg,var(--color-surface-sunken)_50%,var(--color-memo-card-line)_50%)]"
          />
          <span className="flex items-center gap-1.5 pr-4 text-[11px] font-extrabold text-memo-card-label">
            📝 메모
            {starred && <span className="text-important">★ 중요</span>}
            {pinned && (
              <span className="ml-auto rounded-[5px] bg-memo-pin-bg px-1.5 py-0.5 text-[10px] font-extrabold text-memo-pin-text">
                📌 홈 고정
              </span>
            )}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-extrabold wrap-break-word text-ink-900">{title}</span>
            {body && (
              <span className="line-clamp-3 text-[13px]/normal wrap-break-word whitespace-pre-line text-memo-card-body">
                {body}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
