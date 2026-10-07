"use client";

import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import type { ExpenseTotals } from "@/entities/expense";
import { type ExchangeRates, formatMoney, toHome } from "@/shared/lib/money";

import { sortedCurrencies } from "../../lib/period";

type SummaryCardProps = {
  total: ExpenseTotals;
  home: string;
  rates: ExchangeRates;
  /** 「총 지출 · 3명」 의 사람 수. 혼자면 null — 「내가 쓴 돈」 도 보이지 않는다 */
  people: number | null;
  /** 내가 쓴 돈. 환율이 없어 셀 수 없으면 null */
  mySpent: number | null;
  /** 「지출내역 보기 ›」 가 갈 곳(모바일 「지출 · 정산」 탭). PC 는 카테고리 · 정산 카드가 바로 아래라 비운다 — 링크 없음 */
  statsHref?: string;
  /** 카드 아래에 붙이는 것 — PC 의 정산 띠 */
  children?: ReactNode;
};

/**
 * 맨 위 요약 — 「총 지출 · N명 ⌄」 26/800 금액 · 결제 예정 줄, 오른쪽 「내가 쓴 돈」.
 * 금액을 누르면 통화별 합계(외화는 ≈ 원화)와 「지출내역 보기 ›」 가 펼쳐진다.
 * 환율이 없는 통화가 있으면 합계 · 내가 쓴 돈이 그만큼 빠지거나 보이지 않아, 그 이유를 카드 안에 한 줄로 알린다
 */
export function SummaryCard({
  total,
  home,
  rates,
  people,
  mySpent,
  statsHref,
  children,
}: SummaryCardProps) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <div className="flex flex-col gap-3 bg-white px-5 py-4.5">
      <div className="flex items-end gap-2.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
        >
          <span className="flex items-center gap-0.5 text-[13px] font-bold text-ink-400">
            {people === null ? "총 지출" : `총 지출 · ${people}명`}
            <Chevron className="size-3.5 text-ink-350" aria-hidden="true" />
          </span>
          <span className="text-[26px] font-extrabold tracking-tight text-ink-900">
            {formatMoney(total.home, home)}
          </span>
          {total.planned > 0 && (
            <span className="text-xs text-ink-400">
              이 중 결제 예정 {formatMoney(total.planned, home)}
            </span>
          )}
        </button>
        {people !== null && mySpent !== null && (
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-xs text-ink-450">내가 쓴 돈</span>
            <span className="text-[15px] font-extrabold text-ink-900">
              {formatMoney(mySpent, home)}
            </span>
          </div>
        )}
      </div>
      {/* 환율이 없는 통화는 합계 · 내가 쓴 돈에서 빠진다 — 접혀 있어도 이유를 알린다 */}
      {total.missing.length > 0 && (
        <p className="text-xs text-destructive">
          {total.missing.join(" · ")} 환율이 없어 합계에서 빠졌어요. 설정에서 환율을 넣어 주세요.
        </p>
      )}
      {open && (
        <div className="flex flex-col border-t border-line-card">
          {sortedCurrencies(total.byCurrency, home).map(([code, amount]) => (
            <CurrencyLine key={code} code={code} amount={amount} home={home} rates={rates} />
          ))}
          {statsHref && (
            <Link
              href={statsHref}
              className="flex h-10 items-center justify-center gap-1 border-t border-surface-sunken text-[13px] font-bold text-primary"
            >
              지출내역 보기
              <ChevronRight className="size-3.75" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

type CurrencyLineProps = { code: string; amount: number; home: string; rates: ExchangeRates };

/** 통화별 합계 한 줄 — 왼쪽 코드, 오른쪽 금액(외화면 아래 ≈ 원화, 환율이 없으면 빼고) */
export function CurrencyLine({ code, amount, home, rates }: CurrencyLineProps) {
  const approx = code === home ? null : approxHome(amount, code, home, rates);
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm font-bold text-ink-400">{code}</span>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[15px] font-extrabold text-ink-900">{formatMoney(amount, code)}</span>
        {approx !== null && (
          <span className="text-xs text-ink-400">≈ {formatMoney(approx, home)}</span>
        )}
      </div>
    </div>
  );
}

/** 기준 화폐 근사치. 환율이 없으면 null */
function approxHome(amount: number, code: string, home: string, rates: ExchangeRates) {
  return rates[code] ? toHome(amount, code, home, rates) : null;
}
