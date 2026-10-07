import { Button } from "@/shared/ui/button";

type SettleLoadErrorProps = { onRetry: () => void };

/** 정산 자리 — 송금 기록을 읽지 못했을 때. 정산할 것이 없는 것처럼 비워 두지 않고 알린다 */
export function SettleLoadError({ onRetry }: SettleLoadErrorProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="flex-1 text-[13px] text-ink-400">정산을 불러오지 못했어요.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
