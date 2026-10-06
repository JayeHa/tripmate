import { cn } from "cn";
import { Plus, X } from "lucide-react";

type FloatingAddFaceProps = { open: boolean };

/** 플로팅 「+ 추가」(P17) 버튼의 안쪽 — 펼치면 ✕ */
export function FloatingAddFace({ open }: FloatingAddFaceProps) {
  const Icon = open ? X : Plus;
  return (
    <>
      <Icon className="size-5" strokeWidth={2.4} />
      <span className="text-[15px] font-extrabold">추가</span>
    </>
  );
}

/** 플로팅 「+ 추가」(P17) 버튼 모양 — 48 높이 파란 pill, 펼치면 잉크. 자리(fixed · absolute)는 쓰는 쪽에서 */
export function floatingAddClass(open: boolean): string {
  return cn(
    "flex h-12 items-center gap-1.5 rounded-full pr-4.5 pl-3.5 text-white shadow-[0_6px_18px_rgba(58,139,255,0.35),0_2px_6px_rgba(0,0,0,0.12)]",
    open ? "bg-ink-900" : "bg-brand",
  );
}
