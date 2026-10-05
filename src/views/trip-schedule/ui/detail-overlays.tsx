"use client";

import { MemoComposerDialog } from "@/features/schedule/memo-composer";
import { PlaceFormDialog } from "@/features/schedule/place-form";
import { dayLabel } from "@/shared/lib/days";
import { Toast } from "@/shared/ui/toast";

import type { DetailOverlays as Overlays } from "../model/use-detail-overlays";

type DetailOverlaysProps = {
  tripId: string;
  startDate: string;
  isDesktop: boolean;
  overlays: Overlays;
};

/** 일정 상세 · 카드 위에 여는 창들 — 대체 장소 직접 추가 · 장소 정보 수정 · 메모 작성 · 토스트 */
export function DetailOverlays({ tripId, startDate, isDesktop, overlays: o }: DetailOverlaysProps) {
  return (
    <>
      {o.altAdd && (
        <PlaceFormDialog
          tripId={tripId}
          city={o.altAdd.city}
          mode={{
            kind: "add",
            dayIndex: o.altAdd.main.day_index,
            initialQuery: "",
            alternativeOf: o.altAdd.main,
            onSaved: o.closeAltAdd,
          }}
          open
          onOpenChange={(open) => !open && o.closeAltAdd()}
        />
      )}

      {o.placeEdit && (
        <PlaceFormDialog
          tripId={tripId}
          city={o.placeEdit.city}
          mode={{
            kind: "edit",
            place: o.placeEdit.place,
            onSaved: (changed) => {
              o.closePlaceEdit();
              if (changed) o.showToast("장소 정보를 수정했어요");
            },
          }}
          open
          onOpenChange={(open) => !open && o.closePlaceEdit()}
        />
      )}

      {o.memo && (
        <MemoComposerDialog
          // 다른 일정 · 메모를 열면 처음 값에서 다시 시작한다
          key={`${o.memo.row.item.id}:${o.memo.memo?.id ?? "new"}`}
          tripId={tripId}
          row={o.memo.row}
          when={[
            `day ${o.memo.row.item.day_index + 1} · ${dayLabel(startDate, o.memo.row.item.day_index)}`,
            o.memo.row.time,
          ]
            .filter(Boolean)
            .join(" ")}
          memo={o.memo.memo}
          isDesktop={isDesktop}
          onClose={o.closeMemo}
        />
      )}

      <Toast message={o.toast} onDone={o.clearToast} />
    </>
  );
}
