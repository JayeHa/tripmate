import { Button } from "@/shared/ui/button";

import type { MemoEditState } from "../model/use-memo-edit";

type MemoBlockProps = {
  /** 메모 줄들(빈 줄 뺌) */
  notes: string[];
  edit: MemoEditState;
};

/**
 * 메모 — 줄마다 · 로 보이는 연회색 박스. 「수정」(없으면 「+ 메모」)을 누르면 그 자리에서 한 칸을 고친다.
 * 작성자 · ★ 중요 · 링크가 붙는 메모 목록은 ④ 에서 이 자리를 대신한다.
 */
export function MemoBlock({ notes, edit }: MemoBlockProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">메모 {notes.length}</span>
        {edit.text === null && (
          <button type="button" onClick={edit.start} className="text-sm font-bold text-primary">
            {notes.length > 0 ? "수정" : "+ 메모"}
          </button>
        )}
      </div>
      {edit.text === null ? (
        <MemoView notes={notes} />
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={edit.text}
            onChange={(e) => edit.setText(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="한 줄에 하나씩 적어 주세요"
            aria-label="메모"
            className="resize-none rounded-card border border-primary px-3.5 py-3 text-sm/normal text-ink-900 outline-none"
          />
          {edit.error && <p className="text-[13px] text-destructive">{edit.error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="h-11 flex-1" onClick={edit.cancel}>
              취소
            </Button>
            <Button className="h-11 flex-2" disabled={edit.saving} onClick={edit.save}>
              저장
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

type MemoViewProps = { notes: string[] };

/** 보기: 줄마다 · , 없으면 「아직 메모가 없어요.」 */
function MemoView({ notes }: MemoViewProps) {
  if (notes.length === 0) return <p className="text-[13px] text-ink-350">아직 메모가 없어요.</p>;
  return (
    <div className="flex flex-col gap-1.5 rounded-card bg-surface-sunken px-3.5 py-3">
      {notes.map((line, i) => (
        // 메모 줄은 같은 글이 두 번 올 수 있고 순서만 있다
        // eslint-disable-next-line react/no-array-index-key
        <p key={i} className="flex gap-1.5 text-sm/normal text-ink-600">
          <span className="text-ink-350">·</span>
          <span className="text-pretty">{line}</span>
        </p>
      ))}
    </div>
  );
}
