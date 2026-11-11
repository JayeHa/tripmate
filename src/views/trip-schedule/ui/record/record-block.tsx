import type { ReactNode } from "react";

const LABEL = "text-[13px] font-bold text-ink-700";

type RecordBlockProps = {
  label: string;
  /** 입력 칸이 하나면 라벨을 그 칸에 잇는다 */
  htmlFor?: string;
  /** 라벨 줄 오른쪽(「3 / 10」) */
  aside?: ReactNode;
  children: ReactNode;
};

/** 기록 창 본문 한 덩이 — 라벨 13/700(오른쪽에 덧붙일 글) + 내용, 사이 8 */
export function RecordBlock({ label, htmlFor, aside, children }: RecordBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={LABEL}>
            {label}
          </label>
        ) : (
          <span className={LABEL}>{label}</span>
        )}
        {aside}
      </div>
      {children}
    </div>
  );
}
