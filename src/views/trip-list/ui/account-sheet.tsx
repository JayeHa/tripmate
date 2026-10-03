"use client";

import type { MyProfile } from "@/entities/session";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";
import { AccountPanel } from "./account-panel";

type Props = {
  open: boolean;
  profile: MyProfile | null | undefined;
  onClose: () => void;
};

/** 모바일: 헤더 아바타를 누르면 열리는 계정 바텀시트. */
export function AccountSheet({ open, profile, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-sheet p-0 pb-[env(safe-area-inset-bottom)]"
      >
        <AccountPanel profile={profile} Title={SheetTitle} />
      </SheetContent>
    </Sheet>
  );
}
