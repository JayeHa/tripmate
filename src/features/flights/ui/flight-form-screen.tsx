"use client";

import { usePaymentDraft } from "@/entities/expense";
import type { Flight, FlightSaveResult } from "@/entities/flight";
import { useUser } from "@/entities/session";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { ScreenHeader } from "@/shared/ui/screen-header";

import { type FlightExpenseRequest, flightPayName } from "../lib/flight-payment";
import { useFlightDelete } from "../model/use-flight-delete";
import { type FlightFormState, useFlightForm } from "../model/use-flight-form";
import { AirlineStep } from "./airline-step";
import { AirportStep } from "./airport-step";
import { CardOutConfirm, DeleteFlightConfirm } from "./flight-confirms";
import { FlightForm } from "./flight-form";
import { FlightPaymentDraftSection, FlightPaymentSection } from "./flight-payment";

type FlightFormScreenProps = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  /** 고치는 항공편. 새로 만들면 null */
  flight: Flight | null;
  /** 고치는 항공편에 일정 카드가 있다 */
  hasCard: boolean;
  onBack: () => void;
  /** paid — 새 항공편의 결제 초안을 만들지 못했으면 false(항공편은 저장됐다) */
  onSaved: (result: FlightSaveResult, paid: boolean) => void;
  onDeleted: () => void;
  onLockChange: (locked: boolean) => void;
  /** 결제 칸 — 비용 입력 창을 여는 쪽(화면)에 넘긴다. 새 항공편은 초안으로 열린다 */
  onExpense: (req: FlightExpenseRequest) => void;
};

/**
 * 항공편 입력 화면 — 머리와 폼 안 화면(입력 칸들 · 「항공편명 등록」 · 공항 찾기). 찾기 화면의 ← 는 입력 칸들로 돌아간다.
 * 저장 중에는 창을 닫지 못한다
 */
export function FlightFormScreen({
  tripId,
  trip,
  flight,
  hasCard,
  onBack,
  onSaved,
  onDeleted,
  onLockChange,
  onExpense,
}: FlightFormScreenProps) {
  const { data: user } = useUser();
  const payment = usePaymentDraft(tripId, "flight", user?.id);
  const form = useFlightForm({
    tripId,
    trip,
    flight,
    hasCard,
    savePayment: payment.save,
    onSaved,
  });
  const del = useFlightDelete({ tripId, flightId: flight?.id ?? "", onDeleted });
  const locked = form.locked || payment.locked;
  useReportLock(locked, onLockChange);
  return (
    <>
      <FormHeader
        form={form}
        editing={flight !== null}
        saving={form.saving || payment.saving}
        locked={locked}
        onBack={onBack}
      />
      {form.screen.kind === "form" && (
        <>
          {del.error && <p className="px-6 pt-2 text-[13px] text-destructive">{del.error}</p>}
          <FlightForm
            form={form}
            onDelete={flight && !del.deleting ? del.request : null}
            payment={
              flight ? (
                <FlightPaymentSection tripId={tripId} flight={flight} onExpense={onExpense} />
              ) : (
                <FlightPaymentDraftSection
                  tripId={tripId}
                  name={form.values.airlineCode ? flightPayName(draftFlight(form)) : "항공편"}
                  payment={payment}
                  disabled={form.saving || payment.saving}
                  onExpense={onExpense}
                />
              )
            }
          />
        </>
      )}
      {form.screen.kind === "airline" && <AirlineStep draft={form.airline} />}
      {form.screen.kind === "airport" && (
        <AirportStep
          key={form.screen.which}
          label={AIRPORT_TITLE[form.screen.which]}
          onPick={(code) => {
            if (form.screen.kind === "airport") form.pickAirport(form.screen.which, code);
          }}
        />
      )}
      <CardOutConfirm open={form.confirming} onResolve={form.resolveConfirm} />
      <DeleteFlightConfirm
        open={del.open}
        hasCard={hasCard}
        paid={del.paid}
        checklistCount={del.checklistCount}
        onCancel={del.cancel}
        onConfirm={del.confirm}
      />
    </>
  );
}

const AIRPORT_TITLE = { dep: "출발 공항", arr: "도착 공항" } as const;

/** 폼 값의 항공사 · 편명 — 새 결제 이름(flightPayName) */
function draftFlight(form: FlightFormState) {
  const v = form.values;
  return { airline_name: v.airlineName, airline_code: v.airlineCode, flight_no: v.flightNo };
}

type FormHeaderProps = {
  form: FlightFormState;
  editing: boolean;
  /** 항공편 · 결제 초안을 저장하는 중 — 「완료」 를 막는다 */
  saving: boolean;
  /** 닫지 못한다(요청이 서버에 가 있다) */
  locked: boolean;
  onBack: () => void;
};

/** 머리 — 입력 칸들은 「항공편 추가/수정 · 완료」, 「항공편명 등록 · 완료」, 공항 찾기는 제목만 */
function FormHeader({ form, editing, saving, locked, onBack }: FormHeaderProps) {
  const { screen } = form;
  if (screen.kind === "airport") {
    return (
      <ScreenHeader
        title={AIRPORT_TITLE[screen.which]}
        back={{ kind: "back", onClick: form.toForm }}
      />
    );
  }
  if (screen.kind === "airline") {
    return (
      <ScreenHeader
        title="항공편명 등록"
        back={{ kind: "back", onClick: form.toForm }}
        action={{ label: "완료", onClick: form.applyAirline, disabled: !form.airline.result }}
      />
    );
  }
  return (
    <ScreenHeader
      title={editing ? "항공편 수정" : "항공편 추가"}
      back={{ kind: "back", onClick: onBack }}
      action={{ label: "완료", onClick: form.submit, disabled: !form.complete || saving }}
      locked={locked}
    />
  );
}
