"use client";

import { useState } from "react";

import { directionLabel, type Flight, type FlightSaveResult } from "@/entities/flight";
import type { Memo } from "@/entities/schedule-item";
import { useOpenCount } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { ScreenHeader } from "@/shared/ui/screen-header";

import { flightSavedToast } from "../lib/flight-form";
import { useCurrentFlight } from "../model/use-current-flight";
import { type FlightsStep, useFlightsFlow } from "../model/use-flights-flow";
import { FlightDetail } from "./flight-detail";
import { FlightFormScreen } from "./flight-form-screen";
import { FlightList } from "./flight-list";
import { FlightMemos } from "./flight-memos";

type LinkedItem = { id: string; flight_id: string | null; alternative_of: string | null };

type FlightsDialogProps = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  /** 일정 줄 — 항공편에 일정 카드가 있는지 본다 */
  items: readonly LinkedItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 열 때 바로 보일 항공편. 없으면 목록부터 */
  initialFlightId?: string | null;
  onToast?: (text: string) => void;
  /** 상세의 「+ 메모」(memo null) · 메모 누르기 — 창을 닫고 그 카드의 메모 작성 창을 연다. 없으면 메모 칸을 그리지 않는다 */
  onMemo?: (cardId: string, memo: Memo | null) => void;
};

/**
 * 항공편 창 — 목록 → 상세 → 입력(새로 · 고치기). 1024px 아래는 전체 화면, 이상은 가운데 480×680.
 * 저장 중에는 닫히지 않는다(locked). 닫히는 동안에도 내용을 그리고(페이드 아웃), 열 때마다 처음부터 다시 그린다(openCount 를 key 로)
 */
export function FlightsDialog({ open, onOpenChange, ...rest }: FlightsDialogProps) {
  const [locked, setLocked] = useState(false);
  const openCount = useOpenCount(open);
  return (
    <Dialog open={open} locked={locked} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(680px,calc(100dvh-2rem))] lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        <FlightsBody
          key={openCount}
          {...rest}
          onClose={() => onOpenChange(false)}
          onLockChange={setLocked}
        />
      </DialogContent>
    </Dialog>
  );
}

type FlightsBodyProps = Omit<FlightsDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
};

/** 창 안 — 흐름(목록 · 상세 · 폼)에 따라 화면 하나 */
function FlightsBody({
  tripId,
  trip,
  items,
  initialFlightId = null,
  onToast,
  onMemo,
  onClose,
  onLockChange,
}: FlightsBodyProps) {
  const first: FlightsStep = initialFlightId
    ? { kind: "detail", id: initialFlightId }
    : { kind: "list" };
  const flow = useFlightsFlow(first, onClose);
  const { step } = flow;
  const { flights, current } = useCurrentFlight(tripId, flow, onToast);
  /** 그 항공편의 일정 카드 id. 탑승일이 기간 밖이면 없다 */
  const cardOf = (id: string) =>
    items.find((i) => i.flight_id === id && !i.alternative_of)?.id ?? null;

  /** 저장이 끝났다 — 새 항공편은 목록으로, 고친 항공편은 상세로 */
  function saved(result: FlightSaveResult) {
    const editing = step.kind === "form" && step.id !== null;
    onToast?.(flightSavedToast(editing, result.card));
    if (editing) flow.openDetail(result.id);
    else flow.toList();
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {step.kind === "list" && (
        <>
          <ScreenHeader title="항공편" back={{ kind: "close", onClick: onClose }} />
          <FlightList
            flights={flights}
            onOpen={flow.openDetail}
            onAdd={() => flow.openForm(null)}
          />
        </>
      )}
      {step.kind === "detail" && current && (
        <DetailScreen
          tripId={tripId}
          flight={current}
          direction={directionLabel(flights.indexOf(current), flights.length)}
          cardId={cardOf(current.id)}
          onBack={flow.toList}
          onEdit={() => flow.openForm(current.id)}
          onMemo={onMemo}
        />
      )}
      {step.kind === "form" && (
        <FlightFormScreen
          tripId={tripId}
          trip={trip}
          flight={step.id ? current : null}
          hasCard={step.id ? cardOf(step.id) !== null : false}
          onBack={flow.back}
          onSaved={saved}
          onDeleted={() => {
            onToast?.("항공편을 삭제했어요");
            flow.toList();
          }}
          onLockChange={onLockChange}
        />
      )}
    </div>
  );
}

type DetailScreenProps = {
  tripId: string;
  flight: Flight;
  direction: string;
  /** 일정 카드 id — 없으면 메모 칸이 없다 */
  cardId: string | null;
  onBack: () => void;
  onEdit: () => void;
  onMemo?: (cardId: string, memo: Memo | null) => void;
};

/** 상세 — 머리(← · 「항공편 정보」 · 편집) + 내용. 일정 카드가 있으면 그 카드의 메모 칸 */
function DetailScreen({
  tripId,
  flight,
  direction,
  cardId,
  onBack,
  onEdit,
  onMemo,
}: DetailScreenProps) {
  return (
    <>
      <ScreenHeader
        title="항공편 정보"
        back={{ kind: "back", onClick: onBack }}
        action={{ label: "편집", onClick: onEdit }}
      />
      <FlightDetail flight={flight} direction={direction}>
        {cardId && onMemo && (
          <FlightMemos tripId={tripId} cardId={cardId} onMemo={(memo) => onMemo(cardId, memo)} />
        )}
      </FlightDetail>
    </>
  );
}
