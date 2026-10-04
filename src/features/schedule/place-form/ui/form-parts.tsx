import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { LinkDraft } from "../lib/place-form";

type FieldProps = {
  label: string;
  /** 「(선택)」 표시 */
  optional?: boolean;
  /** 라벨 오른쪽의 보조 글(좌표 등) */
  aside?: React.ReactNode;
  children: React.ReactNode;
};

/** 칸 하나: 13/700 라벨 + 내용 */
export function Field({ label, optional, aside, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-700">
          {label}
          {optional && <span className="font-medium text-ink-350"> (선택)</span>}
        </span>
        {aside && <span className="text-xs text-ink-400">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

/** 입력 칸 공통 모양(46 높이, 12 둥글기, 회색 테두리) */
export const inputClass =
  "h-11.5 w-full min-w-0 rounded-card border border-line bg-white px-3.5 text-[15px] text-ink-900 outline-none focus:border-primary";

type ChipButtonProps = { on: boolean; onClick: () => void; children: React.ReactNode };

/** 하나를 고르는 칩(34 높이). 고르면 잉크 바탕 */
export function ChipButton({ on, onClick, children }: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-8.5 items-center rounded-full px-3.5 text-sm font-bold",
        on ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-600",
      )}
    >
      {children}
    </button>
  );
}

type LinkListFieldProps = {
  label: string;
  titlePlaceholder: string;
  links: LinkDraft[];
  onChange: (links: LinkDraft[]) => void;
};

/** 제목 + 주소 링크 목록. 줄마다 휴지통, 아래 「링크 추가」 */
export function LinkListField({ label, titlePlaceholder, links, onChange }: LinkListFieldProps) {
  /** i 번째 줄의 칸 하나를 고친다 */
  const update = (i: number, patch: Partial<LinkDraft>) =>
    onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <Field label={label} optional>
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
    </Field>
  );
}
