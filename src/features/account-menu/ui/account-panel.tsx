"use client";

import { LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import { initialOfName, type MyProfile, useSignOut } from "@/entities/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { SheetMenuItem } from "@/shared/ui/sheet-menu-item";

import { accountLabel } from "../lib/account-label";
import { ProfileEditor, type TitleComponent } from "./profile-editor";

type Props = {
  profile: MyProfile | null | undefined;
  /** 감싸는 쪽(시트 · 팝오버)의 제목 컴포넌트. 접근성 이름이 그 컨테이너에 연결된다. */
  Title: TitleComponent;
};

/**
 * 계정 메뉴 내용. 모바일은 바텀시트, PC 는 드롭다운이 감싼다.
 * 내 정보 수정은 별도 페이지가 아니라 같은 자리에서 화면이 바뀐다.
 * 컨테이너가 닫히면 언마운트되므로 다시 열면 메뉴 화면부터 나온다.
 */
export function AccountPanel({ profile, Title }: Props) {
  const [view, setView] = useState<"main" | "profile">("main");
  return view === "main" ? (
    <MainMenu profile={profile} Title={Title} onEditProfile={() => setView("profile")} />
  ) : (
    <ProfileEditor profile={profile} Title={Title} onBack={() => setView("main")} />
  );
}

type MainMenuProps = {
  profile: MyProfile | null | undefined;
  Title: TitleComponent;
  onEditProfile: () => void;
};

function MainMenu({ profile, Title, onEditProfile }: MainMenuProps) {
  const signOut = useSignOut();

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
