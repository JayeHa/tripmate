import { withKeys } from "@/shared/lib/keys";

type MemoSectionProps = {
  notes: string[];
  hours: string | null;
  open: boolean;
  onToggle: () => void;
};

/**
 * 카드 하단의 메모. 접혀 있으면 「메모 N개 보기」만, 펼치면 노트 목록과 운영시간.
 * 일행이 남긴 메모(작성자 · 태그)와 「+ 메모」는 메모 추가 화면과 함께 붙인다.
 */
export function MemoSection({ notes, hours, open, onToggle }: MemoSectionProps) {
  if (notes.length === 0 && !hours) return null;
  return (
    <>
      {open && (
        // relative: 카드 전체를 덮는 상세 열기 영역 위로 올린다. 펼친 메모 본문은 눌러도 반응하지 않는다(README §19)
        <div className="relative mt-1.5 flex flex-col gap-1.5 border-t border-divider pt-3">
          {withKeys(notes, (note) => note).map(({ key, value: note }) => (
            <p key={key} className="flex gap-1.5 text-sm/normal text-ink-600">
              <span className="text-[#bbb]">·</span>
              <span className="text-pretty">{note}</span>
            </p>
          ))}
          {hours && <p className="mt-0.5 text-[13px] font-semibold text-primary">운영 {hours}</p>}
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="relative mt-0.5 self-start text-[13px] font-semibold text-ink-400"
      >
        {open ? "메모 접기 ⌃" : `메모 ${notes.length + (hours ? 1 : 0)}개 보기 ⌄`}
      </button>
    </>
  );
}
