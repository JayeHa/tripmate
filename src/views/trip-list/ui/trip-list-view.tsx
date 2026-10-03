"use client";

import { Ellipsis, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { initialOfName, useMyProfile, useUser } from "@/entities/session";
import {
  groupTrips,
  type Trip,
  TripCard,
  TripRow,
  TripRowCompact,
  useDeleteTrip,
  useTrips,
} from "@/entities/trip";
import { TripCreateFlow, useTripCreate } from "@/features/trip/create";
import { todayISO } from "@/shared/lib/days";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/icon-button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Wordmark } from "@/shared/ui/wordmark";

import { AccountMenu } from "./account-menu";
import { AccountSheet } from "./account-sheet";
import { DeleteTripDialog } from "./delete-trip-dialog";
import { TripActionsMenu } from "./trip-actions-menu";
import { TripActionsSheet } from "./trip-actions-sheet";

/**
 * 내 여행 목록. 1024px 을 경계로 모바일(5a)과 PC(6a) 배치를 가른다.
 * 만들기는 모바일이면 /trips/new 전체 화면, PC 면 이 화면 위 모달(6b·6c)이다.
 */
export function TripListView({ createdId }: { createdId: string | null }) {
  const router = useRouter();
  const { data: trips, isPending, error } = useTrips();
  const deleteTrip = useDeleteTrip();
  const { data: profile } = useMyProfile();
  const { data: user } = useUser();
  const [accountOpen, setAccountOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState<Trip | null>(null);
  const [confirmFor, setConfirmFor] = useState<Trip | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const createFlow = useTripCreate((tripId) => {
    setCreateOpen(false);
    router.replace(`/trips?created=${tripId}`);
  });
  const openCreate = () => {
    createFlow.reset();
    setCreateOpen(true);
  };

  const today = todayISO();
  const groups = useMemo(() => groupTrips(trips ?? [], today), [trips, today]);

  // 사용자를 아직 모르면 숨긴다. 보여 줬다가 지우지 못하는 쪽보다 낫다.
  const canDelete = (trip: Trip | null) => Boolean(user) && trip?.owner_id === user?.id;
  const editTrip = (trip: Trip) => router.push(`/trips/${trip.id}/settings`);
  const askDelete = (trip: Trip) => {
    deleteTrip.reset();
    setConfirmFor(trip);
  };
  const pcActions = (trip: Trip) => (
    <TripActionsMenu
      trip={trip}
      canDelete={canDelete(trip)}
      onEdit={editTrip}
      onDelete={askDelete}
    />
  );

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex h-13 shrink-0 items-center justify-between px-5 lg:hidden">
        <Wordmark className="text-[22px]" />
        {/* 시안 5a: 워드마크 + Avatar 32. 누르면 내 정보 · 로그아웃 */}
        <button type="button" aria-label="내 계정" onClick={() => setAccountOpen(true)}>
          <Avatar>
            <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
          </Avatar>
        </button>
      </header>
      <header className="hidden h-16 shrink-0 items-center justify-between border-b border-divider px-7 lg:flex">
        <Wordmark className="text-[22px]" />
        <AccountMenu profile={profile} />
      </header>

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

        <div className="px-5 pt-5 pb-1 lg:hidden">
          <Link
            href="/trips/new"
            className="flex items-center gap-3.5 rounded-card bg-surface-sunken p-4.5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary">
              <Plus className="size-6 text-white" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col gap-0.75">
              <span className="text-base font-bold text-ink-900">여행 일정 만들기</span>
              <span className="text-[13px] text-ink-400">도시와 날짜만 고르면 바로 시작돼요</span>
            </span>
          </Link>
        </div>

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
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-20 text-center">
            <p className="text-[17px] font-bold text-ink-900">아직 여행이 없어요</p>
            <p className="text-sm text-ink-400">첫 여행을 만들어 일정을 짜보세요.</p>
          </div>
        )}

        {groups.map((group) => (
          <section key={group.kind} className="pt-6 lg:pt-0">
            <h2 className="px-5 pb-1.5 text-[17px] font-extrabold text-ink-900 lg:px-0 lg:pb-3.5 lg:text-lg">
              {group.title}
            </h2>

            <div className="lg:hidden">
              {group.trips.map((trip) => (
                <TripRow
                  key={trip.id}
                  trip={trip}
                  today={today}
                  companionCount={trip.companionCount}
                  highlighted={trip.id === createdId}
                  actions={
                    <IconButton
                      label={`${trip.title} 메뉴`}
                      onClick={() => setSheetFor(trip)}
                      className="-m-2 p-2 text-ink-700"
                    >
                      <Ellipsis className="size-5.5" />
                    </IconButton>
                  }
                />
              ))}
            </div>

            {group.kind === "upcoming" ? (
              <div className="hidden grid-cols-3 gap-5 lg:grid">
                {group.trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    today={today}
                    companionCount={trip.companionCount}
                    highlighted={trip.id === createdId}
                    actions={pcActions(trip)}
                  />
                ))}
                {/* 시안 6a: 다가오는 여행 그리드의 마지막 칸 */}
                <button
                  type="button"
                  onClick={openCreate}
                  className="flex min-h-59 flex-col items-center justify-center gap-2.5 rounded-card border-[1.5px] border-dashed border-line-strong bg-surface-sunken"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary">
                    <Plus className="size-6.5 text-white" strokeWidth={2.4} />
                  </span>
                  <span className="text-base font-bold text-ink-900">여행 일정 만들기</span>
                  <span className="text-[13px] text-ink-400">
                    도시와 날짜만 고르면 바로 시작돼요
                  </span>
                </button>
              </div>
            ) : (
              <div className="hidden grid-cols-2 gap-x-8 lg:grid">
                {group.trips.map((trip) => (
                  <TripRowCompact
                    key={trip.id}
                    trip={trip}
                    companionCount={trip.companionCount}
                    actions={pcActions(trip)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <TripActionsSheet
        trip={sheetFor}
        canDelete={canDelete(sheetFor)}
        onClose={() => setSheetFor(null)}
        onEdit={(trip) => {
          setSheetFor(null);
          editTrip(trip);
        }}
        onDelete={(trip) => {
          setSheetFor(null);
          askDelete(trip);
        }}
      />
      {/* 만드는 중에는 Esc · 바깥 클릭으로 닫히지 않는다 (useTripCreate 의 locked) */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => (open || !createFlow.locked) && setCreateOpen(open)}
      >
        {/* 1024px 아래로 창을 줄이면 전체 화면 모바일 레이아웃으로 바뀐다. 상태는 createFlow 하나를 함께 쓴다.
            창 높이가 낮으면 모달도 줄고 본문이 안에서 스크롤된다(머리·바닥은 고정) */}
        <DialogContent
          showCloseButton={false}
          className="inset-0 h-dvh w-full max-w-none translate-0 gap-0 overflow-hidden rounded-none bg-white p-0 shadow-sheet ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(660px,calc(100dvh-2rem))] lg:w-190 lg:max-w-190 lg:-translate-1/2 lg:rounded-sheet"
        >
          {/* DialogContent 가 grid 라 자식이 min-width:auto 로 내용 폭만큼 커진다.
              줄바꿈 없는 권역 칩 줄이 모달을 화면 밖으로 밀지 않게 min-w-0 으로 묶는다 */}
          <div className="flex h-full min-h-0 min-w-0 flex-col lg:hidden">
            <TripCreateFlow
              layout="mobile"
              state={createFlow}
              Title={DialogTitle}
              onClose={() => setCreateOpen(false)}
            />
          </div>
          <div className="hidden h-full min-h-0 min-w-0 lg:block">
            <TripCreateFlow
              layout="pc"
              state={createFlow}
              Title={DialogTitle}
              onClose={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
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
    </main>
  );
}
