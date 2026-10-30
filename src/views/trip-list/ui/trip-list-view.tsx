"use client";

import { Luggage } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useMyProfile, useUser } from "@/entities/session";
import { DeleteTripDialog, groupTrips, type Trip, useDeleteTrip, useTrips } from "@/entities/trip";
import { AccountSheet } from "@/features/account-menu";
import { InstallNudge } from "@/features/install-nudge";
import { TripCreateFlow, useTripCreate } from "@/features/trip/create";
import { EditDatesDialog } from "@/features/trip/edit-dates";
import { OfflineDownloadDialog, useOfflineDownload } from "@/features/trip/offline-download";
import { todayISO } from "@/shared/lib/days";
import { Button } from "@/shared/ui/button";
import { DialogTitle } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { FlowDialog } from "@/shared/ui/flow-dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

import { CreateTripCard } from "./create-trip-card";
import { TripActionsMenu } from "./trip-actions-menu";
import { TripActionsSheet } from "./trip-actions-sheet";
import { TripGroups } from "./trip-groups";
import { TripListHeader } from "./trip-list-header";

/**
 * 내 여행 목록. 1024px 을 경계로 모바일(5a)과 PC(6a) 배치를 가른다.
 * 만들기는 모바일이면 /trips/new 전체 화면, PC 면 이 화면 위 모달(6b·6c)이다.
 */
export function TripListView() {
  const { data: trips, isPending, error } = useTrips();
  const deleteTrip = useDeleteTrip();
  const { data: profile } = useMyProfile();
  const { data: user } = useUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState<Trip | null>(null);
  const [confirmFor, setConfirmFor] = useState<Trip | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editFor, setEditFor] = useState<Trip | null>(null);
  const createFlow = useTripCreate(() => setCreateOpen(false));
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const download = useOfflineDownload((next) => setToast({ ...next, id: Date.now() }));
  const showToast = useCallback((text: string) => setToast({ text, id: Date.now() }), []);
  const openCreate = () => {
    createFlow.reset();
    setCreateOpen(true);
  };

  const today = todayISO();
  const groups = useMemo(() => groupTrips(trips ?? [], today), [trips, today]);

  // 사용자를 아직 모르면 숨긴다. 보여 줬다가 지우지 못하는 쪽보다 낫다.
  const canDelete = (trip: Trip | null) => Boolean(user) && trip?.owner_id === user?.id;
  // 「여행일정 수정」은 기간 달력으로
  const editTrip = (trip: Trip) => setEditFor(trip);
  const askDelete = (trip: Trip) => {
    deleteTrip.reset();
    setConfirmFor(trip);
  };
  const pcActions = (trip: Trip) => (
    <TripActionsMenu
      trip={trip}
      canDelete={canDelete(trip)}
      onEdit={editTrip}
      downloadHint={download.hint(trip)}
      onDownload={download.open}
      onDelete={askDelete}
    />
  );

  return (
    <main className="flex flex-1 flex-col">
      <TripListHeader profile={profile} onOpenAccount={() => setAccountOpen(true)} />

      <div className="flex flex-1 flex-col pb-[calc(34px+env(safe-area-inset-bottom))] lg:mx-auto lg:w-full lg:max-w-272 lg:gap-9 lg:px-8 lg:pt-9 lg:pb-14">
        <div className="flex items-baseline gap-2 px-5 pt-2.5 lg:items-center lg:gap-2.5 lg:p-0">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900 lg:text-[28px]">
            내 여행
          </h1>
          {trips && (
            <span className="text-[17px] font-extrabold text-primary lg:text-xl">
              {trips.length}
            </span>
          )}
          <Button size="pill" className="ml-auto hidden lg:inline-flex" onClick={openCreate}>
            + 여행 일정 만들기
          </Button>
        </div>

        <CreateTripCard />

        {isPending && (
          <div className="flex flex-col gap-3 px-5 pt-6 lg:p-0">
            <Skeleton className="h-16 rounded-card" />
            <Skeleton className="h-16 rounded-card" />
          </div>
        )}

        {error && (
          <p className="px-5 pt-6 text-sm text-destructive lg:p-0">
            불러오지 못했어요: {error.message}
          </p>
        )}

        {trips?.length === 0 && (
          <EmptyState
            icon={Luggage}
            title="아직 여행이 없어요"
            description="첫 여행을 만들어 일정을 짜보세요."
            className="flex-1 justify-center py-20"
          />
        )}

        <TripGroups
          groups={groups}
          today={today}
          onOpenSheet={setSheetFor}
          pcActions={pcActions}
          onCreate={openCreate}
        />
      </div>

      <TripActionsSheet
        trip={sheetFor}
        canDelete={canDelete(sheetFor)}
        onClose={() => setSheetFor(null)}
        onEdit={(trip) => {
          setSheetFor(null);
          editTrip(trip);
        }}
        downloadHint={download.hint}
        onDownload={(trip) => {
          setSheetFor(null);
          download.open(trip);
        }}
        onDelete={(trip) => {
          setSheetFor(null);
          askDelete(trip);
        }}
      />
      {/* 만드는 중에는 Esc · 바깥 클릭으로 닫히지 않는다 (useTripCreate 의 locked) */}
      <FlowDialog
        open={createOpen}
        locked={createFlow.locked}
        onOpenChange={setCreateOpen}
        mobile={
          <TripCreateFlow
            layout="mobile"
            state={createFlow}
            Title={DialogTitle}
            onClose={() => setCreateOpen(false)}
          />
        }
        pc={
          <TripCreateFlow
            layout="pc"
            state={createFlow}
            Title={DialogTitle}
            onClose={() => setCreateOpen(false)}
          />
        }
      />
      <EditDatesDialog trip={editFor} onClose={() => setEditFor(null)} />
      <AccountSheet open={accountOpen} profile={profile} onClose={() => setAccountOpen(false)} />
      <DeleteTripDialog
        trip={confirmFor}
        pending={deleteTrip.isPending}
        // 오프라인이면 뮤테이션이 실패하지 않고 멈춘다. 그때까지 잠그면 창을 못 닫는다.
        locked={deleteTrip.isPending && !deleteTrip.isPaused}
        error={deleteTrip.error?.message ?? null}
        onCancel={() => setConfirmFor(null)}
        // 실패하면 닫지 않는다. 닫히면 지워졌는지 알 수 없다.
        onConfirm={(trip) => deleteTrip.mutate(trip.id, { onSuccess: () => setConfirmFor(null) })}
      />
      <OfflineDownloadDialog state={download.dialog} />
      <InstallNudge onToast={showToast} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
