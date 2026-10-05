import { ListOrdered, MapPin, NotebookPen } from "lucide-react";

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
