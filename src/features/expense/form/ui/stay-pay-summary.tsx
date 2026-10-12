import { BedDouble } from "lucide-react";

type StayPaySummaryProps = { name: string };

/**
 * 숙소 결제(숙소에 붙은 비용)의 맨 위 — 「숙소 결제」 배지 · 숙소 이름 · 카테고리 · 연결 · 안내.
 * 이름 · 카테고리 · 일정 연결은 숙소가 정해서(DB 가 맞춘다) 칸 대신 글로만 보인다
 */
export function StayPaySummary({ name }: StayPaySummaryProps) {
  return (
    <div className="flex flex-col gap-2.5 px-5 pt-1 pb-4.5">
      <span className="flex h-5.5 w-fit items-center gap-1 rounded-full bg-brand-soft px-2 text-xs font-extrabold text-brand-text">
        <BedDouble className="size-3" aria-hidden="true" />
        숙소 결제
      </span>
      <span className="text-[22px] font-extrabold tracking-[-0.02em] text-pretty text-ink-900">
        {name}
      </span>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-400">카테고리</dt>
          <dd className="font-semibold text-ink-900">숙소</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-400">연결</dt>
          <dd className="font-semibold text-ink-900">숙소 정보</dd>
        </div>
      </dl>
      <span className="text-xs text-ink-350">
        이름·카테고리는 숙소 정보에서 정해져요. 아래 값만 바꿀 수 있어요.
      </span>
    </div>
  );
}
