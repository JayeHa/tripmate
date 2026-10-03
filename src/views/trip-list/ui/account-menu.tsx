"use client";

import { ChevronDown } from "lucide-react";

import { initialOfName, type MyProfile } from "@/entities/session";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/shared/ui/popover";

import { AccountPanel } from "./account-panel";

type AccountMenuProps = { profile: MyProfile | null | undefined };

/** PC: 헤더의 「아바타 이름 ▾」를 누르면 열리는 320px 계정 드롭다운 (시안 6a · 16). */
export function AccountMenu({ profile }: AccountMenuProps) {
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
        </Avatar>
        <span className="text-[15px] font-bold text-ink-900">{profile?.display_name}</span>
        <ChevronDown className="size-4 text-ink-400" />
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
