"use client";

import { type ReactNode, useState } from "react";

import type { Stay, StaySaveResult } from "@/entities/stay";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { ScreenHeader } from "@/shared/ui/screen-header";

import type { StayRegistration } from "../lib/stay-form";
import type { StayPaymentRequest } from "../lib/stay-payment";
import { useCurrentStay } from "../model/use-current-stay";
import type { LocationPickRequest } from "../model/use-stay-form";
import { type StaysFlow, type StaysStep, useStaysFlow } from "../model/use-stays-flow";
import { StayDetail } from "./stay-detail";
import { StayFormScreen } from "./stay-form-screen";
import { StayList } from "./stay-list";

type LinkedItem = {
  id: string;
  stay_id: string | null;
  alternative_of: string | null;
  day_index: number;
};

type StaysDialogProps = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  /** 일정 줄 — 연결 카드 수를 센다 */
  items: readonly LinkedItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 열 때 바로 보일 숙소(연결 카드의 「숙소 정보 수정」). 없으면 목록부터 */
  initialStayId?: string | null;
  /** 「숙소로 등록」 — 그 일정으로 채운 새 숙소 폼부터 연다. 저장하거나 뒤로 가면 창을 닫는다(일정 상세로 돌아간다) */
  registration?: StayRegistration | null;
  /** 주소 칸 — 받는 쪽이 장소 입력 폼의 「위치만 고르기」 를 이 창 위에 띄운다 */
  onPickLocation: (req: LocationPickRequest) => void;
  /** 결제 칸(상세 · 수정 · 새 숙소 초안) — 받는 쪽이 비용 입력 창을 이 창 위에 띄운다 */
  onPayment: (req: StayPaymentRequest) => void;
  onToast?: (text: string) => void;
  /** 상세의 바우처 칸 — 뷰어 · 바로 올리기는 바우처 기능이라 화면이 그린다. 없으면 칸이 없다 */
  renderVouchers?: (stayId: string) => ReactNode;
};

/**
 * 숙소 창 — 목록 → 상세(예약 상태 바로 바꾸기) → 입력(새로 · 고치기). 1024px 아래는 전체 화면, 이상은 가운데 560×760.
 * 저장 중에는 닫히지 않는다(locked). 닫히면 언마운트되어 다시 열면 목록부터
 */
export function StaysDialog({ open, onOpenChange, ...rest }: StaysDialogProps) {
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={open} locked={locked} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(760px,calc(100dvh-2rem))] lg:w-140 lg:max-w-140 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {open && (
          <StaysBody {...rest} onClose={() => onOpenChange(false)} onLockChange={setLocked} />
        )}
      </DialogContent>
    </Dialog>
  );
}

type StaysBodyProps = Omit<StaysDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
};

/** 창 안 — 흐름(목록 · 상세 · 폼)에 따라 화면 하나 */
function StaysBody({
  tripId,
  trip,
  items,
  initialStayId = null,
  registration = null,
  onPickLocation,
  onPayment,
  onToast,
  renderVouchers,
  onClose,
  onLockChange,
}: StaysBodyProps) {
  const flow = useStaysFlow(firstStep(initialStayId, registration), onClose);
  const { step } = flow;
  const { stays, current } = useCurrentStay(tripId, flow, onToast);
  // 「숙소로 등록」 으로 연 새 숙소 폼 — 일정 상세에서 왔으니 끝나면 창을 닫는다
  const registering = !!registration && step.kind === "form" && step.id === null;

  /**
   * 저장이 끝났다 — 등록은 창을 닫고, 새 숙소는 목록으로, 고친 숙소는 상세로.
   * 새 숙소의 결제만 실패했으면(paid false) 숙소는 저장됐으니 그대로 가고, 결제를 다시 넣으라고 알린다
   */
  function saved(result: StaySaveResult, paid: boolean) {
    const editing = step.kind === "form" && step.id !== null;
    const text = registering ? registeredToast(result) : savedToast(editing, result);
    onToast?.(paid ? text : PAY_FAILED_TOAST);
    if (registering) {
      onClose();
      return;
    }
    if (step.kind === "form" && step.id) flow.openDetail(step.id);
    else flow.toList();
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {step.kind === "list" && (
        <>
          <ScreenHeader title="숙소" back={{ kind: "close", onClick: onClose }} />
          <StayList stays={stays} onOpen={flow.openDetail} onAdd={() => flow.openForm(null)} />
        </>
      )}
      {step.kind === "detail" && current && (
        <DetailScreen
          stay={current}
          tripId={tripId}
          flow={flow}
          onPayment={onPayment}
          onToast={onToast}
          vouchers={renderVouchers?.(current.id)}
        />
      )}
      {step.kind === "form" && (
        <StayFormScreen
          tripId={tripId}
          trip={trip}
          stay={step.id ? current : null}
          registration={registering ? registration : null}
          items={items}
          onPickLocation={onPickLocation}
          onPayment={onPayment}
          onBack={registering ? onClose : flow.back}
          onSaved={saved}
          onDeleted={(removed) => {
            onToast?.(removed > 0 ? `숙소와 일정 카드 ${removed}개를 지웠어요` : "숙소를 지웠어요");
            flow.toList();
          }}
          onLockChange={onLockChange}
        />
      )}
    </div>
  );
}

type DetailScreenProps = {
  stay: Stay;
  tripId: string;
  flow: StaysFlow;
  onPayment: (req: StayPaymentRequest) => void;
  onToast?: (text: string) => void;
  vouchers: ReactNode;
};

/** 상세 — 머리(← · 「숙소 정보」 · 수정) + 내용 */
function DetailScreen({ stay, tripId, flow, onPayment, onToast, vouchers }: DetailScreenProps) {
  return (
    <>
      <ScreenHeader
        title="숙소 정보"
        back={{ kind: "back", onClick: flow.toList }}
        action={{ label: "수정", onClick: () => flow.openForm(stay.id) }}
      />
      <StayDetail
        tripId={tripId}
        stay={stay}
        onPayment={onPayment}
        onToast={(text) => onToast?.(text)}
        vouchers={vouchers}
      />
    </>
  );
}

/** 처음 보일 화면 — 「숙소로 등록」 은 새 숙소 폼, 숙소를 골라 열었으면 그 상세, 아니면 목록 */
function firstStep(initialStayId: string | null, registration: StayRegistration | null): StaysStep {
  if (registration) return { kind: "form", id: null };
  return initialStayId ? { kind: "detail", id: initialStayId } : { kind: "list" };
}

/** 새 숙소는 저장했지만 결제 초안을 만들지 못했다 */
const PAY_FAILED_TOAST =
  "숙소는 저장했지만 결제는 저장하지 못했어요. 숙소 정보에서 다시 넣어 주세요";

/** 「숙소로 등록」 토스트 — 일정에 더한 카드 수 */
function registeredToast(r: StaySaveResult): string {
  return r.added > 0 ? `숙소로 등록했어요 · 일정에 카드 ${r.added}개 추가` : "숙소로 등록했어요";
}

/** 저장 토스트 — 새 숙소는 넣은 카드 수, 고치기는 바뀐 카드 수 */
function savedToast(editing: boolean, r: StaySaveResult): string {
  if (!editing)
    return r.added > 0 ? `일정에 숙소 카드 ${r.added}개를 넣었어요` : "숙소를 등록했어요";
  const parts = [r.added > 0 && `카드 ${r.added}개 추가`, r.removed > 0 && `${r.removed}개 삭제`];
  const detail = parts.filter(Boolean).join(" · ");
  return detail ? `숙소를 수정했어요 · ${detail}` : "숙소 정보를 수정했어요";
}
