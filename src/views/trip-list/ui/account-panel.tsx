"use client";

import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import {
  DISPLAY_NAME_MAX,
  initialOfName,
  isValidDisplayName,
  type MyProfile,
  useSignOut,
  useUpdateDisplayName,
} from "@/entities/session";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { SheetMenuItem } from "@/shared/ui/sheet-menu-item";

type TitleComponent = React.ComponentType<{ className?: string; children: React.ReactNode }>;

type Props = {
  profile: MyProfile | null | undefined;
  /** 감싸는 쪽(시트 · 팝오버)의 제목 컴포넌트. 접근성 이름이 그 컨테이너에 연결된다. */
  Title: TitleComponent;
};

/**
 * 계정 메뉴 내용 (시안 16 Account Menu). 모바일은 바텀시트, PC 는 드롭다운이 감싼다.
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

/** 로그인 계정 표기. 둘러보기 계정은 이메일이 없다. */
function accountLabel(profile: MyProfile | null | undefined, style: "dot" | "paren") {
  if (!profile?.email || !profile.provider) return "둘러보기 계정";
  return style === "dot"
    ? `${profile.email} · ${profile.provider}`
    : `${profile.email} (${profile.provider})`;
}

function MainMenu({
  profile,
  Title,
  onEditProfile,
}: {
  profile: MyProfile | null | undefined;
  Title: TitleComponent;
  onEditProfile: () => void;
}) {
  const signOut = useSignOut();

  return (
    <>
      <div className="flex items-center gap-3 border-b border-surface-muted px-5 pt-5 pb-4">
        <Avatar className="size-11">
          <AvatarFallback className="text-[15px]">
            {initialOfName(profile?.display_name)}
          </AvatarFallback>
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
          onClick={signOut}
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

function ProfileEditor({
  profile,
  Title,
  onBack,
}: {
  profile: MyProfile | null | undefined;
  Title: TitleComponent;
  onBack: () => void;
}) {
  const current = profile?.display_name ?? "";
  const update = useUpdateDisplayName();
  const [draft, setDraft] = useState(current);

  const trimmed = draft.trim();
  const valid = isValidDisplayName(draft);
  const changed = trimmed !== current;
  const invalidShown = trimmed.length > 0 && !valid;

  function save() {
    if (!valid || !changed || update.isPending) return;
    update.mutate(draft, { onSuccess: onBack });
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4.5">
        <IconButton label="뒤로" onClick={onBack} className="text-ink-900">
          <ArrowLeft className="size-5.5" strokeWidth={2} />
        </IconButton>
        <Title className="text-[17px] font-extrabold text-ink-900">내 정보</Title>
      </div>
      <div className="flex flex-col items-center gap-4.5 px-5 pt-2 pb-6">
        <Avatar className="size-18">
          <AvatarFallback className="text-[25px]">
            {initialOfName(trimmed || current)}
          </AvatarFallback>
        </Avatar>

        <label className="flex w-full flex-col gap-1.5">
          <span className="text-[13px] font-bold text-ink-700">이름</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            maxLength={DISPLAY_NAME_MAX}
            className="h-12 w-full rounded-memo border border-line px-3.5 text-base font-bold text-ink-900 outline-none focus:border-primary"
          />
          <span className={cn("text-xs", invalidShown ? "text-destructive" : "text-ink-400")}>
            {invalidShown
              ? "한글·영어·숫자·밑줄·띄어쓰기만 쓸 수 있어요."
              : "일행에게 이 이름으로 보여요. 모든 여행에 같이 바뀌어요."}
          </span>
        </label>

        <div className="flex w-full flex-col gap-1.5">
          <span className="text-[13px] font-bold text-ink-700">로그인 계정</span>
          <div className="flex h-12 items-center rounded-memo bg-surface-muted px-3.5 text-[15px] text-ink-500">
            {accountLabel(profile, "paren")}
          </div>
        </div>

        <Button
          className="h-12.5 w-full rounded-button text-base font-bold"
          disabled={!valid || !changed || update.isPending}
          onClick={save}
        >
          {update.isPending ? "저장 중…" : "저장"}
        </Button>
        {update.error && <p className="text-[13px] text-destructive">{update.error.message}</p>}
      </div>
    </>
  );
}
