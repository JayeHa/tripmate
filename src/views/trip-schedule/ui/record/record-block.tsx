import type { ReactNode } from "react";

const LABEL = "text-[13px] font-bold text-ink-700";

type RecordBlockProps = {
  label: string;
  /** 라벨 뒤 흐린 덧말 — 「기록 · 일행과 함께 써요」 */
  sub?: string;
  /** 입력 칸이 하나면 라벨을 그 칸에 잇는다 */
  htmlFor?: string;
  /** 라벨 줄 오른쪽(「3 / 10」) */
  aside?: ReactNode;
  children: ReactNode;
};

/** 기록 창 본문 한 덩이 — 라벨 13/700(뒤에 흐린 덧말, 오른쪽에 덧붙일 글) + 내용, 사이 8 */
export function RecordBlock({ label, sub, htmlFor, aside, children }: RecordBlockProps) {
  const text = (
    <>
      {label}
      {sub && <span className="font-medium text-route-card-meta"> · {sub}</span>}
    </>
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={LABEL}>
            {text}
          </label>
        ) : (
          <span className={LABEL}>{text}</span>
        )}
        {aside}
      </div>
      {children}
    </div>
  );
}
