import { Button } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

/** 설명 줄 — 이름 · 설명 */
const ROWS = [
  ["쓴 돈", "함께한 비용 중 내 몫이에요. 함께한 사람 수로 똑같이 나눠요."],
  ["결제한 돈", "내가 직접 결제한 금액의 합이에요."],
  [
    "받을/보낼 돈",
    "결제한 돈 − 쓴 돈. 더 냈으면 받을 돈, 덜 냈으면 보낼 돈이에요. 「보냈어요 · 받았어요」 로 표시한 돈은 빼요.",
  ],
  ["외화", "여행 설정의 환율(또는 비용마다 넣은 환율)로 기준 화폐로 바꿔 계산해요."],
  ["제외", "「합계에서 제외」 한 비용은 계산에 넣지 않아요."],
] as const;

type SettleExplainProps = { open: boolean; onClose: () => void };

/** 「어떻게 계산하나요?」 — 바텀시트(PC 정산 창 안에서도 같은 시트) 5줄 + 닫기 */
export function SettleExplain({ open, onClose }: SettleExplainProps) {
  return (
    <SheetDialog open={open} onClose={onClose} title="어떻게 계산하나요?">
      <dl className="flex flex-col">
        {ROWS.map(([term, text]) => (
          <div key={term} className="flex gap-3 border-b border-surface-muted py-3 last:border-b-0">
            <dt className="w-21 shrink-0 text-sm font-bold text-ink-900">{term}</dt>
            <dd className="text-sm/relaxed text-ink-500">{text}</dd>
          </div>
        ))}
      </dl>
      <Button variant="chip" size="form" className="mt-4 w-full" onClick={onClose}>
        닫기
      </Button>
    </SheetDialog>
  );
}
