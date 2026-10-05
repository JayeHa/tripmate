import type { TimelineLeg } from "../../lib/timeline";
import { DistancePill } from "./distance-pill";

type LegLineProps = {
  leg: TimelineLeg;
  /** 「+ 이동 방법」 · 적어 둔 수단 · 상세를 누르면 이동 방법 창을 연다. 없으면 거리 pill 만 그린다 */
  onEditMove?: () => void;
};

/**
 * 카드 사이의 길. 1줄 `[거리 pill] 🚇 지하철`, 2줄 상세(최대 2줄, 수단 글자 아래 정렬).
 * 아무것도 적지 않았으면 pill 옆에 회색 「+ 이동 방법」.
 */
export function LegLine({ leg, onEditMove }: LegLineProps) {
  const note = leg.modeLabel ?? leg.detail;
  // 수단이 있으면 상세는 둘째 줄, 상세만 있으면 그게 첫 줄 글자다
  const secondLine = leg.modeLabel ? leg.detail : null;
  return (
    <div className="flex flex-col gap-1 pr-5 pb-2.5 pl-2">
      <div className="flex min-w-0 items-center gap-2">
        <DistancePill label={leg.label} url={leg.url} />
        {onEditMove && (
          <button
            type="button"
            onClick={onEditMove}
            title={leg.hasMove ? "이동 방법 수정" : "이동 방법 적기"}
            className={
              note
                ? "min-w-0 truncate text-[13px] font-semibold text-ink-700"
                : "text-xs font-bold whitespace-nowrap text-ink-350"
            }
          >
            {note ?? "+ 이동 방법"}
          </button>
        )}
      </div>
      {onEditMove && secondLine && (
        <button
          type="button"
          onClick={onEditMove}
          className="ml-16 line-clamp-2 text-left text-[13px]/normal text-pretty text-ink-500"
        >
          {secondLine}
        </button>
      )}
    </div>
  );
}
