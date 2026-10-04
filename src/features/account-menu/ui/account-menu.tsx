"use client";

import { ChevronDown } from "lucide-react";

import { initialOfName, type MyProfile } from "@/entities/session";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/shared/ui/popover";

import { AccountPanel } from "./account-panel";

type AccountMenuProps = {
  profile: MyProfile | null | undefined;
  /** 아바타 옆 「이름 ▾」. 내 여행 헤더는 보이고, 여행 안 PC 헤더는 아바타만 */
  showName?: boolean;
};

/** PC: 헤더의 아바타(「아바타 이름 ▾」)를 누르면 열리는 320px 계정 드롭다운. */
export function AccountMenu({ profile, showName = true }: AccountMenuProps) {
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2.5" aria-label="내 계정">
        <Avatar className="size-9">
          <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
        </Avatar>
        {showName && (
          <>
            <span className="text-[15px] font-bold text-ink-900">{profile?.display_name}</span>
            <ChevronDown className="size-4 text-ink-400" />
          </>
        )}
      </PopoverTrigger>
      {/* 입력란이 있는 편집 화면으로 바뀌므로 Menu 가 아니라 Popover 를 쓴다. */}
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-80 gap-0 overflow-hidden rounded-[14px] bg-white p-0 shadow-sheet ring-0"
      >
        <AccountPanel profile={profile} Title={PopoverTitle} />
      </PopoverContent>
    </Popover>
  );
}
