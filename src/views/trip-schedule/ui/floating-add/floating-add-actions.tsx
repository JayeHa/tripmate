import { ListOrdered, MapPin, NotebookPen, Plus, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** 플로팅 「+ 추가」 가 받는 동작. 날짜는 모두 보고 있는 날 */
export type FloatingAddProps = {
  onAddPlace: () => void;
  /** 일정 · 여행을 읽는 동안은 없다 — 「일정 편집」 이 비활성 */
  onStartEdit?: () => void;
  onAddDayMemo: () => void;
};

/** 펼친 세 갈래 — 일정 추가(파랑 핀) · 일정 편집 · 메모 추가 */
export function floatingActions({ onAddPlace, onStartEdit, onAddDayMemo }: FloatingAddProps) {
  return [
    { key: "place", label: "일정 추가", Icon: MapPin, tone: "text-primary", run: onAddPlace },
    { key: "edit", label: "일정 편집", Icon: ListOrdered, tone: "text-ink-700", run: onStartEdit },
    {
      key: "memo",
      label: "메모 추가",
      Icon: NotebookPen,
      tone: "text-ink-700",
      run: onAddDayMemo,
    },
  ];
}

type FloatingAddFaceProps = { open: boolean };

/** 「+ 추가」 버튼의 안쪽 — 펼치면 ✕ */
export function FloatingAddFace({ open }: FloatingAddFaceProps) {
  const Icon = open ? X : Plus;
  return (
    <>
      <Icon className="size-5" strokeWidth={2.4} />
      <span className="text-[15px] font-extrabold">추가</span>
    </>
  );
}

/** 「+ 추가」 버튼 모양 — 48 높이 파란 pill, 펼치면 잉크 */
export function floatingAddClass(open: boolean): string {
  return cn(
    "flex h-12 items-center gap-1.5 rounded-full pr-4.5 pl-3.5 text-white shadow-[0_6px_18px_rgba(58,139,255,0.35),0_2px_6px_rgba(0,0,0,0.12)]",
    open ? "bg-ink-900" : "bg-primary",
  );
}
