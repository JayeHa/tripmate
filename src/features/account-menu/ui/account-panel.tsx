"use client";

import { LogOut, SquarePlus, UserRound } from "lucide-react";
import { useState } from "react";

import { initialOfName, type MyProfile, useSignOut } from "@/entities/session";
import { type InstallMode, useInstallMode } from "@/shared/lib/install-prompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { SheetMenuItem } from "@/shared/ui/sheet-menu-item";

import { accountLabel } from "../lib/account-label";
import { InstallGuide } from "./install-guide";
import { ProfileEditor, type TitleComponent } from "./profile-editor";

type Props = {
  profile: MyProfile | null | undefined;
  /** 감싸는 쪽(시트 · 팝오버)의 제목 컴포넌트. 접근성 이름이 그 컨테이너에 연결된다. */
  Title: TitleComponent;
  /** PC 드롭다운인가 — 앱 추가 안내의 문구가 다르다 */
  pc?: boolean;
};

/** 메뉴 안에서 바뀌는 화면 — 앱 추가는 연 때의 안내 방식을 쥔다(설치 창을 띄우면 방식이 사라진다) */
type View = { name: "main" } | { name: "profile" } | { name: "install"; mode: "ios" | "prompt" };

/**
 * 계정 메뉴 내용. 모바일은 바텀시트, PC 는 드롭다운이 감싼다.
 * 내 정보 수정 · 앱 추가는 별도 페이지가 아니라 같은 자리에서 화면이 바뀐다.
 * 컨테이너가 닫히면 언마운트되므로 다시 열면 메뉴 화면부터 나온다.
 */
export function AccountPanel({ profile, Title, pc = false }: Props) {
  const [view, setView] = useState<View>({ name: "main" });
  const toMain = () => setView({ name: "main" });
  if (view.name === "profile")
    return <ProfileEditor profile={profile} Title={Title} onBack={toMain} />;
  if (view.name === "install") {
    return <InstallGuide mode={view.mode} pc={pc} Title={Title} onBack={toMain} />;
  }
  return (
    <MainMenu
      profile={profile}
      Title={Title}
      onEditProfile={() => setView({ name: "profile" })}
      onInstall={(mode) => setView({ name: "install", mode })}
    />
  );
}

type MainMenuProps = {
  profile: MyProfile | null | undefined;
  Title: TitleComponent;
  onEditProfile: () => void;
  onInstall: (mode: NonNullable<InstallMode>) => void;
};

/** 메뉴 첫 화면 — 내 정보 · 앱 추가(설치할 수 있을 때만) · 로그아웃 */
function MainMenu({ profile, Title, onEditProfile, onInstall }: MainMenuProps) {
  const signOut = useSignOut();
  const installMode = useInstallMode();

  return (
    <>
      <div className="flex items-center gap-3 border-b border-surface-muted px-5 pt-5 pb-4">
        <Avatar className="size-11">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Title className="truncate text-[17px] font-extrabold text-ink-900">
            {profile?.display_name ?? "이름 없음"}
          </Title>
          <span className="truncate text-[13px] text-ink-400">{accountLabel(profile, "dot")}</span>
        </div>
      </div>
      <div className="py-1.5">
        {/* 편집기는 마운트할 때 한 번만 이름을 읽는다. 불러오기 전에 열면 빈 칸으로 남는다. */}
        <SheetMenuItem
          icon={UserRound}
          onClick={onEditProfile}
          disabled={!profile}
          className="px-5 hover:bg-surface-sunken"
        >
          내 정보 수정
        </SheetMenuItem>
        {installMode && (
          <SheetMenuItem
            icon={SquarePlus}
            hint="오프라인 사용"
            onClick={() => onInstall(installMode)}
            className="px-5 hover:bg-surface-sunken"
          >
            홈 화면에 앱 추가
          </SheetMenuItem>
        )}
        <SheetMenuItem
          icon={LogOut}
          onClick={() => void signOut()}
          danger
          className="px-5 hover:bg-surface-sunken"
        >
          로그아웃
        </SheetMenuItem>
      </div>
      <div className="h-3.5" />
    </>
  );
}
