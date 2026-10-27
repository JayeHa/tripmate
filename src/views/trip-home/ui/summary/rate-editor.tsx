"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import { useSetTripRate } from "@/entities/trip";
import { currencyName, formatMoney } from "@/shared/lib/money";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { liveRateValue, parseRate, rateSaveError } from "../../lib/calculator";

type RateEditorProps = {
  tripId: string;
  /** 여행지 통화 · 기준 화폐 */
  local: string;
  home: string;
  /** 지금 여행 환율 */
  rate: { unit: number; value: number };
  /** 실시간 환율(같은 단위의 기준 화폐 금액) — 있으면 「지금 환율로」 */
  live: number | null;
  /** 저장했거나 취소했다 — 계산기로 돌아간다 */
  onDone: () => void;
  /** 저장 요청 중 — 창이 닫히지 않게 */
  onLockChange: (locked: boolean) => void;
};

/**
 * 여행 환율 바꾸기 — 계산기 창 안에서 「100엔 = [920] 원」 을 고친다. 실시간 값이 있으면 「지금 환율 ₩844로」 로 채울 수 있다.
 * 환율을 따로 적지 않은 비용의 기준 화폐 환산 · 정산이 일행 모두에게 바뀌어 저장 전에 한 줄로 알린다.
 * 저장은 그 통화 하나만 바꾼다(set_trip_rate — 그사이 일행이 바꾼 다른 통화를 덮지 않음)
 */
export function RateEditor({
  tripId,
  local,
  home,
  rate,
  live,
  onDone,
  onLockChange,
}: RateEditorProps) {
  const [text, setText] = useState(String(rate.value));
  const save = useSetTripRate(tripId);
  useReportLock(save.isPending, onLockChange);
  const value = parseRate(text);
  const suggest = live === null ? null : liveRateValue(live, home);
  const homeWord = home === "KRW" ? "원화" : "기준 화폐";
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[15px] font-extrabold text-ink-900">여행 환율 바꾸기</p>
      <label className="flex items-center gap-2 text-[15px] font-semibold text-ink-700">
        <span className="shrink-0">
          {rate.unit.toLocaleString("ko-KR")}
          {currencyName(local)} =
        </span>
        <Input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={value === null}
          aria-label={`${currencyName(local)} 환율`}
          className="flex-1 text-right font-bold"
        />
        <span className="shrink-0">{currencyName(home)}</span>
      </label>
      {suggest !== null && (
        <button
          type="button"
          onClick={() => setText(String(suggest))}
          className="flex h-8 cursor-pointer items-center self-start rounded-full bg-surface-muted px-3 text-[13px] font-bold text-ink-700"
        >
          지금 환율 {formatMoney(suggest, home)}로
        </button>
      )}
      <p className="flex gap-1.5 text-xs/normal text-ink-400">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        환율을 따로 적지 않은 비용의 {homeWord} 환산 · 정산이 일행 모두에게 바뀌어요
      </p>
      {save.isError && (
        <p role="alert" className="text-[13px] text-destructive">
          {rateSaveError(save.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          variant="chip"
          size="form"
          className="flex-1"
          disabled={save.isPending}
          onClick={onDone}
        >
          취소
        </Button>
        <Button
          size="form"
          className="flex-1"
          disabled={value === null || value === rate.value || save.isPending}
          onClick={() =>
            value !== null &&
            save.mutate(
              { home, code: local, rate: { unit: rate.unit, value } },
              { onSuccess: onDone },
            )
          }
        >
          저장
        </Button>
      </div>
    </div>
  );
}
