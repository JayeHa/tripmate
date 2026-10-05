import type { Memo, MemoAuthor } from "../../model/memo";
import { MemoCard } from "../memo-card";

type MemoSectionProps = {
  memos: Memo[];
  hours: string | null;
  open: boolean;
  onToggle: () => void;
  /** 메모 작성자 표시. 모르면 null */
  authorOf: (authorId: string | null) => MemoAuthor | null;
};

/**
 * 카드 하단의 메모. ★ 중요 메모는 접어 둬도 보인다. 펼치면 모든 메모와 운영시간.
 * 아래 줄은 「메모 N개 보기 ⌄ / 메모 접기 ⌃」. 메모 쓰기는 일정 상세의 「+ 메모」 에서만 한다.
 * 메모 본문은 눌러도 반응하지 않는다(카드 전체를 덮는 상세 열기 영역 위로 relative 로 올린다)
 */
export function MemoSection({ memos, hours, open, onToggle, authorOf }: MemoSectionProps) {
  // useOpenMemos 의 hasMemo 와 같은 기준이어야 「모두 펼치기」가 이 카드를 센다
  const expandable = memos.length > 0 || !!hours;
  const shown = open ? memos : memos.filter((m) => m.starred);
  if (!expandable) return null;
  return (
    <>
      {(shown.length > 0 || (open && hours)) && (
        <div className="relative mt-1.5 flex flex-col gap-2 border-t border-divider pt-3">
          {shown.map((memo) => (
            <MemoCard key={memo.id} memo={memo} author={authorOf(memo.author_id)} />
          ))}
          {open && hours && (
            <p className="mt-0.5 text-[13px] font-semibold text-primary">운영 {hours}</p>
          )}
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="relative mt-0.5 self-start text-[13px] font-semibold text-ink-400"
      >
        {open ? "메모 접기 ⌃" : `메모 ${memos.length + (hours ? 1 : 0)}개 보기 ⌄`}
      </button>
    </>
  );
}
