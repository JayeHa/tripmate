import { ListTodo, Ticket } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";

type NoteChipsProps = {
  /** 끝나지 않은 체크리스트 수와 노트 체크리스트 주소 — 수가 0 이거나 없으면 칩을 그리지 않는다 */
  checklist?: { count: number; href: string };
  /** 바우처 수와 누르면 할 일 — 수가 0 이거나 없으면 칩을 그리지 않는다 */
  vouchers?: { count: number; onOpen: () => void };
};

/** 노트 칩 줄(24 · r12 · 12/700) — 「체크리스트 N」(주황, 노트로) · 「바우처 N」(파랑). 둘 다 없으면 그리지 않는다 */
export function NoteChips({ checklist, vouchers }: NoteChipsProps) {
  const showChecklist = !!checklist && checklist.count > 0;
  const showVouchers = !!vouchers && vouchers.count > 0;
  if (!showChecklist && !showVouchers) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {showChecklist && (
        <Link
          href={checklist.href}
          transitionTypes={NAV.tab}
          className="relative inline-flex h-6 items-center gap-1 rounded-full bg-checklist-due-bg px-2 text-xs font-bold text-checklist-due"
        >
          <ListTodo className="size-3.25" aria-hidden="true" />
          체크리스트 {checklist.count}
        </Link>
      )}
      {showVouchers && (
        <button
          type="button"
          onClick={vouchers.onOpen}
          className="relative inline-flex h-6 items-center gap-1 rounded-full bg-surface-selected px-2 text-xs font-bold text-brand-text"
        >
          <Ticket className="size-3.25" strokeWidth={2.2} aria-hidden="true" />
          바우처 {vouchers.count}
        </button>
      )}
    </div>
  );
}
