"use client";

import { Link as LinkIcon } from "lucide-react";
import type { ReactNode } from "react";

import { LinkedChecklist, useLinkedChecklist } from "@/entities/checklist";
import { PaymentField, PayOverdueBanner } from "@/entities/expense";
import { type ReservationStatus, ReservationStatusPicker } from "@/entities/schedule-item";
import {
  type Stay,
  stayLinksOf,
  stayMomentLabel,
  stayRangeLabel,
  useUpdateStayStatus,
} from "@/entities/stay";

import { STAY_DEFAULT_EMOJI } from "../lib/stay-form";
import { STAY_LEDGER_LABEL, type StayPaymentRequest } from "../lib/stay-payment";
import { useStayPayment } from "../model/use-stay-payment";
import { StayExpenses } from "./stay-expenses";

type StayDetailProps = {
  tripId: string;
  stay: Stay;
  /** 결제 칸 — 비용 입력 창을 여는 쪽(화면)에 넘긴다 */
  onPayment: (req: StayPaymentRequest) => void;
  /** 체크리스트를 완료했다 · 실패했다 — 토스트는 화면이 그린다 */
  onToast: (text: string) => void;
  /** 바우처 칸(화면이 그린 것) — 결제 아래, 체크리스트 위 */
  vouchers?: ReactNode;
};

/**
 * 숙소 상세 — (결제 예정일 지남 안내) · 제목(아이콘 이름) · 기간 · 예약 상태(「수정」 없이 바로 바꾼다) ·
 * 표(주소 · 체크인 · 체크아웃 · 메모 · 링크) · 결제 · 숙소 카드에 연결된 비용 · 바우처(화면이 넣는다) · 이 숙소에 연결된 끝나지 않은 체크리스트
 */
export function StayDetail({ tripId, stay, onPayment, onToast, vouchers }: StayDetailProps) {
  const status = useUpdateStayStatus(tripId);
  const checklist = useLinkedChecklist(tripId, [{ kind: "stay", id: stay.id }], onToast);
  const pay = useStayPayment(tripId, stay.id);
  const p = stay.place;
  const links = stayLinksOf(stay.links);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 pt-1 pb-6">
      <PayOverdueBanner pay={pay} />
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
          {stay.emoji || STAY_DEFAULT_EMOJI} {p.name}
        </h2>
        <span className="text-sm text-ink-500">{stayRangeLabel(stay)}</span>
      </div>
      <div className="flex flex-col gap-2 pt-0.5 pb-1">
        <span className="text-[13px] font-bold text-ink-700">예약 상태</span>
        <ReservationStatusPicker
          value={(stay.status as ReservationStatus | null) ?? null}
          onChange={(next) => status.mutate({ stayId: stay.id, status: next })}
        />
        {status.error && <p className="text-[13px] text-destructive">{status.error.message}</p>}
      </div>
      <dl className="flex flex-col overflow-hidden rounded-card border border-line [&>*+*]:border-t [&>*+*]:border-line-card">
        <Row label="주소">
          {p.gmap_url ? (
            <a
              href={p.gmap_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px]/normal font-semibold text-brand"
            >
              {p.address ?? p.name}
            </a>
          ) : (
            <span className="text-[15px]/normal text-ink-900">{p.address ?? "—"}</span>
          )}
          {p.address_local && (
            <span className="text-[13px]/normal text-ink-450">{p.address_local}</span>
          )}
        </Row>
        <Row label="체크인">{stayMomentLabel(stay.check_in_date, stay.check_in_time)}</Row>
        <Row label="체크아웃">{stayMomentLabel(stay.check_out_date, stay.check_out_time)}</Row>
        {stay.memo && (
          <Row label="메모">
            <span className="text-[15px]/[1.55] whitespace-pre-line text-ink-900">{stay.memo}</span>
          </Row>
        )}
        {links.length > 0 && (
          <Row label="링크">
            <div className="flex flex-wrap gap-1.5">
              {links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7.5 items-center gap-1.25 rounded-full border border-line px-2.5 text-[13px] font-semibold text-ink-700"
                >
                  <LinkIcon className="size-3.25 text-ink-500" />
                  {l.title || l.url}
                </a>
              ))}
            </div>
          </Row>
        )}
      </dl>
      <PaymentField
        loaded={pay.loaded}
        view={pay.view}
        ledgerLabel={STAY_LEDGER_LABEL}
        onOpen={() =>
          onPayment({ kind: "saved", stayId: stay.id, name: p.name, expenseId: pay.expenseId })
        }
      />
      <StayExpenses
        tripId={tripId}
        stayId={stay.id}
        onOpen={(expenseId) => onPayment({ kind: "linked", expenseId })}
      />
      {vouchers}
      <LinkedChecklist tripId={tripId} items={checklist.items} onComplete={checklist.complete} />
    </div>
  );
}

type RowProps = { label: string; children: ReactNode };

/** 표 한 줄 — 왼쪽 이름 72 · 13/700, 오른쪽 값 15 */
function Row({ label, children }: RowProps) {
  return (
    <div className="flex gap-3.5 px-4 py-3.5">
      <dt className="w-18 shrink-0 pt-px text-[13px] font-bold text-ink-500">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-col gap-0.75 text-[15px]/normal text-ink-900">
        {children}
      </dd>
    </div>
  );
}
