"use client";

import { DeleteTripDialog, type Trip } from "@/entities/trip";
import { LeaveTripDialog } from "@/entities/trip-member";
import { EditCitiesDialog } from "@/features/trip/edit-cities";
import { EditDatesDialog } from "@/features/trip/edit-dates";
import { TitleDialog } from "@/features/trip/edit-title";
import { InviteDialog } from "@/features/trip/invite-member";

import { useTripEdit } from "../../model/use-trip-edit";
import { MobileEditMenu, PcEditMenu } from "./edit-menus";
import { WidgetEditor } from "./widget-editor";

type TripEditProps = {
  trip: Trip;
  layout: "mobile" | "pc";
  /** 「편집」 글자 크기 · 색 */
  className: string;
};

/**
 * 여행 홈 머리의 「편집」 — 모바일은 바텀시트, PC 는 드롭다운 메뉴. 고른 줄의 창(도시 · 제목 · 날짜 · 일행 초대 · 홈 위젯 · 나가기 · 삭제)도 여기서 그린다.
 * 기준 화폐 · 여행 환율 · 멤버 내보내기는 설정 탭에 그대로 있다
 */
export function TripEdit({ trip, layout, className }: TripEditProps) {
  const edit = useTripEdit(trip);
  const Menu = layout === "pc" ? PcEditMenu : MobileEditMenu;
  return (
    <>
      <Menu menu={edit.menu} onChoose={edit.choose} className={className} />
      <EditCitiesDialog tripId={trip.id} open={edit.open === "cities"} onClose={edit.close} />
      <TitleDialog trip={trip} open={edit.open === "title"} onClose={edit.close} />
      <EditDatesDialog trip={edit.open === "dates" ? trip : null} onClose={edit.close} />
      <InviteDialog trip={trip} open={edit.open === "invite"} onClose={edit.close} />
      <WidgetEditor trip={trip} open={edit.open === "widgets"} onClose={edit.close} />
      <LeaveTripDialog
        open={edit.open === "leave"}
        pending={edit.leave.pending}
        locked={edit.leave.locked}
        error={edit.leave.error}
        onCancel={edit.close}
        onConfirm={edit.leave.confirm}
      />
      <DeleteTripDialog
        trip={edit.open === "delete" ? trip : null}
        pending={edit.remove.pending}
        locked={edit.remove.locked}
        error={edit.remove.error}
        onCancel={edit.close}
        onConfirm={edit.remove.confirm}
      />
    </>
  );
}
