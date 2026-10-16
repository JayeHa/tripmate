"use client";

import { DateField } from "@/shared/ui/date-field";
import { Textarea } from "@/shared/ui/textarea";

import { MEMO_MAX, SITE_TITLE_MAX, SITE_URL_MAX } from "../lib/voucher-form";
import type { OwnerOption } from "../model/use-owner-options";
import type { VoucherFormState } from "../model/use-voucher-form";
import { FormField } from "./form-field";
import { NumberRows } from "./number-rows";

type MoreFieldsProps = {
  form: VoucherFormState;
  /** 번호 주인 고르기의 멤버. 혼자인 여행이면 null */
  members: OwnerOption[] | null;
};

/**
 * 「추가 정보 입력」 안 — 사용일(연결이 없을 때만, 있으면 연결한 일정의 날짜를 쓴다) · 번호 · 예약 사이트(이름 + 주소 한 칸) · 메모
 */
export function MoreFields({ form, members }: MoreFieldsProps) {
  const { values: v, set } = form;
  return (
    <>
      {!v.target && (
        <FormField label="사용일" hint="선택">
          <DateField
            value={v.useDate}
            onChange={(d) => set("useDate", d)}
            placement="top"
            placeholder="날짜 선택"
            aria-label="사용일"
          />
        </FormField>
      )}
      <FormField label="번호">
        <NumberRows numbers={v.numbers} onChange={(n) => set("numbers", n)} members={members} />
      </FormField>
      <FormField label="예약 사이트">
        <div className="flex flex-col overflow-hidden rounded-card border border-input bg-white">
          <input
            value={v.siteTitle}
            onChange={(e) => set("siteTitle", e.target.value)}
            maxLength={SITE_TITLE_MAX}
            placeholder="이름 (예: 클룩)"
            aria-label="예약 사이트 이름"
            className="h-11 border-b border-surface-muted px-3 text-[15px] font-bold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-350"
          />
          <input
            value={v.siteUrl}
            onChange={(e) => set("siteUrl", e.target.value)}
            maxLength={SITE_URL_MAX}
            inputMode="url"
            placeholder="https://"
            aria-label="예약 사이트 주소"
            className="h-11 px-3 text-sm text-primary outline-none placeholder:text-ink-350"
          />
        </div>
      </FormField>
      <FormField label="메모">
        <Textarea
          value={v.memo}
          onChange={(e) => set("memo", e.target.value)}
          maxLength={MEMO_MAX}
          rows={3}
          placeholder="사용 방법 · 미팅 장소 · 환불 규정 등"
          aria-label="메모"
          className="resize-none text-sm/normal"
        />
      </FormField>
    </>
  );
}
