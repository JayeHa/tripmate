"use client";

import { useState } from "react";

import { initialOfName, type MyProfile } from "@/entities/session";
import { DeleteTripDialog, type Trip, useTrip } from "@/entities/trip";
import { LeaveTripDialog } from "@/entities/trip-member";
import { AccountSheet } from "@/features/account-menu";
import { EditCitiesDialog } from "@/features/trip/edit-cities";
import { EditDatesDialog } from "@/features/trip/edit-dates";
import { TitleDialog } from "@/features/trip/edit-title";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Toast } from "@/shared/ui/toast";

import { type TripSettingsState, useTripSettings } from "../model/use-trip-settings";
import { ExitSection } from "./exit-section";
import { HomeCurrencyDialog } from "./home-currency-dialog";
import { HomeCurrencyPicker } from "./home-currency-picker";
import { InviteCard } from "./invite-card";
import { KickMemberDialog } from "./kick-member-dialog";
import { MembersCard } from "./members-card";
import { RatesDialog } from "./rates-dialog";
import { SettingsSkeleton } from "./settings-skeleton";
import { TripInfoCard } from "./trip-info-card";

type TripSettingsViewProps = { tripId: string };

/** 여행 설정 탭 — 여행을 읽은 뒤 화면을 그린다 */
export function TripSettingsView({ tripId }: TripSettingsViewProps) {
  const { data: trip } = useTrip(tripId);
  if (!trip) return <SettingsSkeleton />;
  return <SettingsScreen trip={trip} />;
}

type SettingsScreenProps = { trip: Trip };

/**
 * 일행 초대 → 멤버 → 여행 정보 → 여행 삭제(멤버는 나가기). 모바일은 한 줄로, PC 는 왼쪽(초대 · 멤버) · 오른쪽(정보 · 삭제) 2열.
 * 여행 정보의 이름 · 도시 · 기간은 여행 홈 「편집」 과 같은 창, 기준 화폐 · 환율은 이 화면의 창을 연다. 내 정보 · 로그아웃은 계정 메뉴(모바일 머리 아바타 · PC 헤더)에 있다
 */
function SettingsScreen({ trip }: SettingsScreenProps) {
  const s = useTripSettings(trip);
  return (
    <>
      <MobileHeader profile={s.profile} />
      <main className="flex flex-1 flex-col bg-surface-sunken">
        <div className="flex w-full flex-col gap-3 px-4 pt-3 pb-7 lg:mx-auto lg:max-w-260 lg:gap-5 lg:px-10 lg:pt-8 lg:pb-10">
          <h1 className="hidden text-2xl font-extrabold tracking-[-0.02em] text-ink-900 lg:block">
            여행 설정
          </h1>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-5">
            <div className="flex flex-col gap-3 lg:gap-5">
              <InviteCard trip={trip} onToast={s.showToast} />
              {s.members && (
                <MembersCard
                  members={s.members}
                  myId={s.user?.id}
                  ownerId={trip.owner_id}
                  onKick={s.kick.ask}
                />
              )}
            </div>
            <div className="flex flex-col gap-3 lg:gap-5">
              <TripInfoCard
                rows={s.rows}
                actions={{
                  title: () => s.choose("title"),
                  cities: () => s.choose("cities"),
                  dates: () => s.choose("dates"),
                  home: () => s.choose("home"),
                  rates: () => s.choose("rates"),
                }}
              />
              <ExitSection
                isOwner={s.exit.isOwner}
                onClick={() => s.choose(s.exit.isOwner ? "delete" : "leave")}
              />
            </div>
          </div>
        </div>
      </main>
      <SettingsDialogs trip={trip} s={s} />
      <Toast message={s.toast} onDone={s.clearToast} />
    </>
  );
}

type MobileHeaderProps = { profile: MyProfile | null | undefined };

/** 모바일 머리 — 「여행 설정」 18/800 + 아바타 32(누르면 계정 시트: 내 정보 · 로그아웃) */
function MobileHeader({ profile }: MobileHeaderProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <>
      <header className="sticky top-(--shell-top) z-20 flex h-13 shrink-0 items-center justify-between bg-white px-5 lg:hidden">
        <h1 className="text-lg font-extrabold text-ink-900">여행 설정</h1>
        <button type="button" aria-label="내 계정" onClick={() => setAccountOpen(true)}>
          <Avatar>
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
          </Avatar>
        </button>
      </header>
      <AccountSheet open={accountOpen} profile={profile} onClose={() => setAccountOpen(false)} />
    </>
  );
}

type SettingsDialogsProps = { trip: Trip; s: TripSettingsState };

/** 설정에서 여는 창 — 이름 · 도시 · 기간(홈 「편집」 과 같은 창), 기준 화폐 · 환율, 멤버 내보내기, 나가기 · 삭제 */
function SettingsDialogs({ trip, s }: SettingsDialogsProps) {
  return (
    <>
      <TitleDialog trip={trip} open={s.open === "title"} onClose={s.close} />
      <EditCitiesDialog tripId={trip.id} open={s.open === "cities"} onClose={s.close} />
      <EditDatesDialog trip={s.open === "dates" ? trip : null} onClose={s.close} />
      <HomeCurrencyPicker
        current={trip.home_currency}
        open={s.open === "home"}
        onClose={s.close}
        onPick={s.rebase.pick}
      />
      <HomeCurrencyDialog
        trip={trip}
        to={s.rebase.to}
        onCancel={s.rebase.cancel}
        onChanged={s.rebase.done}
      />
      <RatesDialog
        trip={trip}
        destination={s.destination}
        open={s.open === "rates"}
        onClose={s.close}
        onSaved={s.ratesSaved}
      />
      <KickMemberDialog kick={s.kick} />
      <LeaveTripDialog
        open={s.open === "leave"}
        pending={s.exit.leave.pending}
        locked={s.exit.leave.locked}
        error={s.exit.leave.error}
        onCancel={s.close}
        onConfirm={s.exit.leave.confirm}
      />
      <DeleteTripDialog
        trip={s.open === "delete" ? trip : null}
        pending={s.exit.remove.pending}
        locked={s.exit.remove.locked}
        error={s.exit.remove.error}
        onCancel={s.close}
        onConfirm={s.exit.remove.confirm}
      />
    </>
  );
}
