import type { RouteTone, StopTone } from "@/entities/schedule-item";

/** 기록 모드의 역 하나 — 노선도 카드가 받는 값 */
export type StopRecord = {
  tone: StopTone;
  /** 들어오는 · 나가는 구간을 지나왔다(초록), 아니면 남은 구간(연회색) */
  inPassed: boolean;
  outPassed: boolean;
  /** 다녀왔어요를 누른 시각(ISO) */
  markedAt: string | null;
  /** 패스한 곳 */
  skipped: boolean;
  /** 지금 여기 — 「✓ 다녀왔어요」. 누를 수 없는 날 · 다른 역은 없다 */
  onVisited?: () => void;
};

/** 역 하나의 모양 — 표식 · 카드, 들어오는 · 나가는 구간, 패스 · 도착 시각, 흐리게 할지 */
export type StopLook = {
  tone: StopTone;
  inTone: RouteTone;
  outTone: RouteTone;
  skipped: boolean;
  markedAt: string | null;
  /** 다녀온 일정 회색(계획 모드만) — 카드 · 다음 구간 */
  faded: boolean;
  fadedNext: boolean;
};

/**
 * 계획 · 기록 모드에 따른 역 모양. 계획은 수단 색 선과 다녀온 일정 회색,
 * 기록은 다녀감으로 칠한 표식 · 지나온 초록 · 남은 연회색 선(회색으로 흐리게 하지 않는다)
 */
export function stopLook(
  record: StopRecord | undefined,
  past: "done" | "skipped" | null,
  nextPast: boolean,
): StopLook {
  if (!record) {
    return {
      tone: "plan",
      inTone: "plan",
      outTone: "plan",
      skipped: past === "skipped",
      markedAt: null,
      faded: past !== null,
      fadedNext: nextPast,
    };
  }
  return {
    tone: record.tone,
    inTone: record.inPassed ? "done" : "todo",
    outTone: record.outPassed ? "done" : "todo",
    skipped: record.skipped,
    markedAt: record.markedAt,
    faded: false,
    fadedNext: false,
  };
}

/** 지금 여기 카드 첫 줄 오른쪽 칩 — 초록 · 흰 11/800 · r5 */
export function HereChip() {
  return (
    <span className="rounded-[5px] bg-visited px-1.5 py-0.5 text-[11px] font-extrabold text-white">
      지금 여기
    </span>
  );
}

type VisitedButtonProps = { onClick: () => void };

/** 지금 여기 카드 안 「✓ 다녀왔어요」 — 44 · r10 · 초록 · 흰 15/800(PC 40 · 14/800). 누르면 다음 역이 지금 여기 */
export function VisitedButton({ onClick }: VisitedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center rounded-memo bg-visited text-[15px] font-extrabold text-white lg:h-10 lg:text-sm"
    >
      ✓ 다녀왔어요
    </button>
  );
}
