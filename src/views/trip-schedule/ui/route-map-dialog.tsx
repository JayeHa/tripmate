"use client";

import { ChevronLeft } from "lucide-react";

import { ScheduleMap, type TimelineRow } from "@/entities/schedule-item";
import { dayParts } from "@/shared/lib/days";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";

/** 지도로 볼 날과 고른 장소 */
export type RouteMapTarget = { day: number; focusId: string | null };

type RouteMapDialogProps = {
  /** 열린 날. null 이면 닫혀 있다 */
  target: RouteMapTarget | null;
  onClose: () => void;
  startDate: string;
  /** 그 날의 타임라인 줄 */
  rowsOf: (day: number) => TimelineRow[];
};

/**
 * 모바일 동선 지도 — 일정 위에 전체 화면으로 연다(상단바 「🗺 동선 보기」 · 역 펼침 「🗺 지도에서」).
 * 위에 ‹ 와 「day 3 · 11.2 (월) 동선」, 아래는 그 날 지도가 꽉 찬다. 「지도에서」 로 열면 그 장소의 핀을 강조한다.
 * 카드 넘기기 · 수단별 선은 다음 단계에서 이 창을 바꾼다
 */
export function RouteMapDialog({ target, onClose, startDate, rowsOf }: RouteMapDialogProps) {
  // 닫히는 동안 지도를 그대로 둔다(빈 틀이 보이지 않게)
  const shown = useHeldWhileClosing(target !== null, target);
  const { date, dow } = dayParts(startDate, shown?.day ?? 0);
  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none"
      >
        <div className="flex items-center gap-2 px-2.5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2">
          <DialogClose
            aria-label="일정으로 돌아가기"
            className="flex size-10 shrink-0 items-center justify-center text-ink-900"
          >
            <ChevronLeft className="size-6.5" />
          </DialogClose>
          <DialogTitle className="truncate text-[15px] font-extrabold text-ink-900">
            <span className="text-route-stop">
              day {(shown?.day ?? 0) + 1} · {date} ({dow})
            </span>{" "}
            동선
          </DialogTitle>
        </div>
        <div className="min-h-0 flex-1">
          {shown && <ScheduleMap rows={rowsOf(shown.day)} pinSize="lg" focusId={shown.focusId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
