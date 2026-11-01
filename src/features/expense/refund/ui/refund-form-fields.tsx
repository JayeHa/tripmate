"use client";

import { REFUND_PROVIDERS } from "@/entities/tax-refund";
import { DateField } from "@/shared/ui/date-field";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Input } from "@/shared/ui/input";
import { TimeField } from "@/shared/ui/time-field";

import { PROVIDER_MAX, SITE_URL_MAX, STORE_MAX, TRANSACTION_MAX } from "../lib/refund-form";
import type { RefundFormState } from "../model/use-refund-form";

type FieldProps = { form: RefundFormState };

type FieldLabelProps = { children: string; optional?: boolean };

/** 칸 머리 — 13/700, 선택이면 회색 「(선택)」 */
export function FieldLabel({ children, optional = false }: FieldLabelProps) {
  return (
    <span className="text-[13px] font-bold text-ink-700">
      {children}
      {optional && <span className="font-medium text-ink-350"> (선택)</span>}
    </span>
  );
}

type StoreFieldProps = FieldProps & { autoFocus: boolean };

/** 매장 — 필수. 새 건이면 바로 친다 */
export function StoreField({ form, autoFocus }: StoreFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>매장</FieldLabel>
      <Input
        value={form.draft.store}
        onChange={(e) => form.set("store", e.target.value)}
        maxLength={STORE_MAX}
        placeholder="キデイランド新宿店"
        autoFocus={autoFocus}
      />
    </label>
  );
}

/** 환급 사업자 — 자주 쓰는 사업자 칩(누르면 칸에 들어간다) + 직접 입력 */
export function ProviderField({ form }: FieldProps) {
  const { provider } = form.draft;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel optional>환급 사업자</FieldLabel>
      <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="환급 사업자">
        {REFUND_PROVIDERS.map((p) => (
          <FilterChip
            key={p}
            size="sm"
            selected={p === provider}
            onClick={() => form.set("provider", p === provider ? "" : p)}
          >
            {p}
          </FilterChip>
        ))}
      </div>
      <Input
        value={provider}
        onChange={(e) => form.set("provider", e.target.value)}
        maxLength={PROVIDER_MAX}
        placeholder="영수증 · 안내문의 사업자 이름"
        aria-label="환급 사업자 이름"
      />
    </div>
  );
}

/** 구매 날짜 · 시각 — 날짜를 비우면 시각도 저장하지 않는다 */
export function WhenFields({ form }: FieldProps) {
  const { boughtOn, boughtTime } = form.draft;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel optional>구매 날짜 · 시각</FieldLabel>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <DateField
            value={boughtOn}
            onChange={(d) => form.set("boughtOn", d)}
            placeholder="날짜"
            aria-label="구매 날짜"
          />
        </div>
        <div className="w-40 shrink-0">
          <TimeField
            value={boughtTime}
            onChange={(t) => form.set("boughtTime", t)}
            disabled={!boughtOn}
            aria-label="구매 시각"
          />
        </div>
      </div>
    </div>
  );
}

/** 거래번호 · 신청 사이트 주소 — 나중에 환급이 안 들어왔을 때 찾아볼 것 */
export function ReferenceFields({ form }: FieldProps) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <FieldLabel optional>거래번호</FieldLabel>
        <Input
          value={form.draft.transactionId}
          onChange={(e) => form.set("transactionId", e.target.value)}
          maxLength={TRANSACTION_MAX}
          placeholder="Transaction ID"
          autoComplete="off"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <FieldLabel optional>신청 사이트</FieldLabel>
        <Input
          value={form.draft.siteUrl}
          onChange={(e) => form.set("siteUrl", e.target.value)}
          maxLength={SITE_URL_MAX}
          inputMode="url"
          placeholder="https://"
          autoComplete="off"
          className="text-sm text-primary"
        />
      </label>
    </>
  );
}
