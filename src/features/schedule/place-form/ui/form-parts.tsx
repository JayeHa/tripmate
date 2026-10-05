import { cn } from "@/shared/lib/utils";
import { type LinkDraft, LinkRows } from "@/shared/ui/link-rows";

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

/** 입력 칸 공통 모양 — 44 · r10 · 1px #E3E5E8, 포커스 1.5px 블루(공용 Input 과 같은 값) */
export const inputClass =
  "h-11 w-full min-w-0 rounded-memo border border-line bg-white px-3 text-[15px] text-ink-900 outline-none focus:border-primary focus:shadow-[0_0_0_0.5px_var(--color-primary)]";

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

/** 제목 + 주소 링크 목록(라벨 「(선택)」 + 공용 LinkRows) */
export function LinkListField({ label, titlePlaceholder, links, onChange }: LinkListFieldProps) {
  return (
    <Field label={label} optional>
      <LinkRows
        label={label}
        titlePlaceholder={titlePlaceholder}
        links={links}
        onChange={onChange}
      />
    </Field>
  );
}
