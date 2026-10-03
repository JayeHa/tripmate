"use client";

import { ChevronRight, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { initialOfName, type MyProfile, useSignOut } from "@/entities/session";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

type Props = {
  open: boolean;
  profile: MyProfile | null | undefined;
  onClose: () => void;
};

/** 헤더 아바타를 누르면 열리는 계정 메뉴. 내 정보 · 로그아웃. */
export function AccountSheet({ open, profile, onClose }: Props) {
  const signOut = useSignOut();
  const name = profile?.display_name ?? "이름 없음";

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="gap-1.5 rounded-t-sheet px-5 pt-2.5 pb-[calc(34px+env(safe-area-inset-bottom))]"
      >
        <span aria-hidden="true" className="mx-auto mb-2 h-1 w-9 rounded-sm bg-[#DDD]" />
        <div className="flex items-center gap-3 px-1 pb-3">
          <Avatar size="lg">
            <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle className="truncate text-[17px] font-extrabold text-ink-900">
              {name}
            </SheetTitle>
            {profile?.email && (
              <span className="truncate text-[13px] text-ink-400">{profile.email}</span>
            )}
          </div>
        </div>
        <Link
          href="/me"
          onClick={onClose}
          className="flex h-13 items-center gap-3 border-t border-surface-muted px-1 text-base font-semibold text-ink-900"
        >
          <UserRound className="size-[22px] text-ink-700" />
          <span className="flex-1">내 정보</span>
          <ChevronRight className="size-[18px] text-ink-400" />
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex h-13 items-center gap-3 border-t border-surface-muted px-1 text-base font-semibold text-ink-900"
        >
          <LogOut className="size-[22px] text-ink-700" />
          로그아웃
        </button>
      </SheetContent>
    </Sheet>
  );
}
