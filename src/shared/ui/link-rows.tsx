import { Plus, Trash2 } from "lucide-react";

/** 링크 한 줄(입력 중) */
export type LinkDraft = { title: string; url: string };

type LinkRowsProps = {
  /** 칸 이름 — 입력 칸 aria-label 에 붙는다(「장소 링크 제목」) */
  label: string;
  titlePlaceholder: string;
  links: LinkDraft[];
  onChange: (links: LinkDraft[]) => void;
};

/** 제목 + 주소 링크 줄들. 줄마다 휴지통, 아래 「링크 추가」. 라벨 · 검증은 부르는 쪽이 둔다 */
export function LinkRows({ label, titlePlaceholder, links, onChange }: LinkRowsProps) {
  /** i 번째 줄의 칸 하나를 고친다 */
  const update = (i: number, patch: Partial<LinkDraft>) =>
    onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <>
      {links.map((link, i) => (
        // 링크 줄은 순서만 있고 고유 값이 없다(같은 내용 두 줄도 가능). 추가 · 삭제 외엔 순서가 바뀌지 않는다
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="flex overflow-hidden rounded-card border border-line">
          <div className="flex min-w-0 flex-1 flex-col">
            <input
              value={link.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder={titlePlaceholder}
              aria-label={`${label} 제목`}
              className="h-11 border-b border-divider px-3.5 text-[15px] font-bold text-ink-900 outline-none"
            />
            <input
              value={link.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://"
              inputMode="url"
              aria-label={`${label} 주소`}
              className="h-11 px-3.5 text-sm text-ink-700 outline-none"
            />
          </div>
          <button
            type="button"
            aria-label={`${label} 지우기`}
            onClick={() => onChange(links.filter((_, j) => j !== i))}
            className="flex w-11 items-center justify-center border-l border-divider text-ink-400"
          >
            <Trash2 className="size-4.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { title: "", url: "" }])}
        className="flex h-10 items-center justify-center gap-1 rounded-card border border-dashed border-line-strong text-sm font-bold text-ink-600"
      >
        <Plus className="size-4" /> 링크 추가
      </button>
    </>
  );
}
