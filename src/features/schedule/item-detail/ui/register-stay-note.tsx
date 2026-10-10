import { BedDouble } from "lucide-react";

type RegisterStayNoteProps = { onRegister: () => void };

/**
 * 숙소 탭에 없는 숙소 일정의 안내 — 흰 칸에 🛏 · 「숙소 탭에 없는 숙소예요」 · 「숙소로 등록」.
 * 등록하면 이 카드가 새 숙소의 연결 카드가 되어 체크인 정보 · 결제가 붙는다
 */
export function RegisterStayNote({ onRegister }: RegisterStayNoteProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-memo border border-input bg-white px-3.5 py-3">
      <BedDouble className="size-5 shrink-0 text-ink-700" strokeWidth={2} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-bold text-ink-900">숙소 탭에 없는 숙소예요</span>
        <span className="text-xs/[1.45] text-ink-400">
          등록하면 체크인 정보·결제가 이 카드와 연결돼요
        </span>
      </div>
      <button
        type="button"
        onClick={onRegister}
        className="flex h-8.5 shrink-0 items-center rounded-button bg-brand px-3 text-[13px] font-bold text-white"
      >
        숙소로 등록
      </button>
    </div>
  );
}
