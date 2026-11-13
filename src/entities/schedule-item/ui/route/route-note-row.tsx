import type { RouteLine } from "../../lib/route";
import { RouteLineBar } from "./route-line";

type RouteNoteRowProps = {
  /** 메모 글(줄바꿈 그대로) */
  text: string;
  /** 이 줄을 지나는 구간 선(앞 역 → 다음 역). 마지막 역 뒤면 null */
  line: RouteLine | null;
  /** 누르면 — 시간 · 메모 창 */
  onClick: () => void;
};

/**
 * 노선도의 역 사이 날짜 메모 한 줄 — 카드 칸에 흰 상자(r10 · 안쪽 8 10 · 12 회색 · 「📌」), 선 칸에는 구간 선이 이어진다.
 * 날짜 메모는 장소에 딸린 것이 아니라서 앞 역의 카드 안이 아니라 카드 밖에 따로 둔다(day 머리의 첫 역 앞 메모와 같은 모양)
 */
export function RouteNoteRow({ text, line, onClick }: RouteNoteRowProps) {
  return (
    <div className="grid grid-cols-[48px_28px_minmax(0,1fr)]">
      <span />
      <span className="relative">
        <RouteLineBar line={line} className="inset-y-0" />
      </span>
      <div className="min-w-0 py-1 pl-1">
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-memo bg-white px-2.5 py-2 text-left text-xs/[1.45] whitespace-pre-line text-route-walk-text"
        >
          📌 {text}
        </button>
      </div>
    </div>
  );
}
