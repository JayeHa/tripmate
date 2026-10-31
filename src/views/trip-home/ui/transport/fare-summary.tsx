type SumBlockProps = {
  label: string;
  /** 큰 금액 — 「¥2,700 + ₩20,000」 */
  total: string;
  /** 기준 통화 어림값 — 「≈ ₩24,840」 */
  approx: string | null;
  children?: React.ReactNode;
};

/** 합계 한 칸 — 작은 이름 · 큰 금액 · 어림값 */
function SumBlock({ label, total, approx, children }: SumBlockProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold text-ink-400">{label}</span>
      <p className="text-2xl/tight font-extrabold text-ink-900 tabular-nums">{total}</p>
      {approx && <p className="text-[13px] text-ink-400 tabular-nums">{approx}</p>}
      {children}
    </div>
  );
}

type FareSummaryProps = {
  /** 1인 예상 합계. 적은 금액이 없으면 null */
  total: string | null;
  approx: string | null;
  /** 일행 수만큼 — 혼자면 null */
  group: { people: number; total: string | null } | null;
  /** 가계부 교통 비용의 내 몫. 없으면 null */
  actual: { total: string; approx: string | null } | null;
};

/**
 * 「1인 교통비」 카드 내용 — 예상(통화별 합 · 어림값 · 일행 수만큼) 아래 실제(가계부 교통 비용의 내 몫).
 * 실제는 가계부에 교통 비용이 있을 때만
 */
export function FareSummary({ total, approx, group, actual }: FareSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      {total ? (
        <SumBlock label="예상" total={total} approx={approx}>
          {group && (
            <p className="mt-1 text-[13px] text-ink-500">
              {group.people}명이면 <span className="font-bold tabular-nums">{group.total}</span>
            </p>
          )}
        </SumBlock>
      ) : (
        <p className="text-[13px] text-ink-400">날짜마다 1인 교통비를 적으면 여기서 더해요</p>
      )}
      {actual && (
        <div className="border-t border-divider pt-3">
          <SumBlock label="실제 · 내 몫" total={actual.total} approx={actual.approx} />
        </div>
      )}
    </div>
  );
}
