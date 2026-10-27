import { cn } from "@/shared/lib/utils";

type RateCreditProps = { className?: string };

/**
 * 실시간 환율의 출처 링크 — ExchangeRate-API 무료 주소는 환율을 보이는 곳에 이 링크를 두라고 한다(작고 눈에 덜 띄어도 된다).
 * 실시간 값을 보일 때만 그린다
 * @see https://www.exchangerate-api.com/docs/free
 */
export function RateCredit({ className }: RateCreditProps) {
  return (
    <a
      href="https://www.exchangerate-api.com"
      target="_blank"
      rel="noreferrer"
      className={cn("text-[11px] text-ink-350 hover:underline", className)}
    >
      Rates By Exchange Rate API
    </a>
  );
}
