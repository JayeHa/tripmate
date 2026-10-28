"use client";

import { Link2, Share2, X } from "lucide-react";

import { useUser } from "@/entities/session";
import type { Trip } from "@/entities/trip";
import { type TripMember, useTripMembers } from "@/entities/trip-member";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/icon-button";

import { useInviteLink } from "../model/use-invite-link";

type InviteDialogProps = { trip: Trip; open: boolean; onClose: () => void };

/**
 * 일행 초대(여행 홈 「편집」) — 모바일은 전체 화면, PC 는 가운데 440 창.
 * 위에 여행 이름 · 「여행 친구 N」 · 안내 · 「초대 링크 복사」 | 「다른 앱으로 초대」, 아래에 멤버 목록.
 * 멤버 내보내기 · 링크 재발급은 설정 화면에 그대로 둔다
 */
export function InviteDialog({ trip, open, onClose }: InviteDialogProps) {
  const { data: members } = useTripMembers(trip.id);
  const { data: user } = useUser();
  const link = useInviteLink(trip);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[min(640px,calc(100dvh-2rem))] lg:w-110 lg:max-w-110 lg:-translate-1/2 lg:rounded-sheet"
      >
        <div className="flex h-14 shrink-0 items-center px-4.5 pt-[env(safe-area-inset-top)] lg:pt-0">
          <IconButton label="닫기" onClick={onClose} className="flex text-ink-900">
            <X className="size-6" strokeWidth={2} />
          </IconButton>
        </div>
        <div className="flex shrink-0 flex-col gap-2.5 border-b border-divider px-6 pt-1.5 pb-6.5">
          <DialogTitle className="truncate text-2xl/tight font-extrabold text-ink-900">
            {trip.title}
          </DialogTitle>
          <span className="pt-3 text-[17px] font-extrabold text-ink-900">
            여행 친구 <span className="text-primary">{members?.length ?? ""}</span>
          </span>
          <p className="text-sm/relaxed text-ink-450">
            함께 여행 갈 친구나 가족을 초대해 보세요.
            <br />
            링크를 받은 사람은 Google 로그인 후 일정을 함께 계획할 수 있어요.
          </p>
          <div className="flex gap-2 pt-3.5">
            <Button
              variant="brand"
              size="pill"
              className="h-12.5 flex-1"
              onClick={() => void link.copy()}
            >
              <Link2 className="size-4.25" />
              {link.copied ? "복사했어요" : "초대 링크 복사"}
            </Button>
            <Button
              variant="outline"
              size="pill"
              className="h-12.5 flex-1 border-line-strong text-ink-700"
              onClick={() => void link.share()}
            >
              <Share2 className="size-4.25" />
              다른 앱으로 초대
            </Button>
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
          {members?.map((m) => (
            <MemberRow key={m.user_id} member={m} me={m.user_id === user?.id} />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

type MemberRowProps = { member: TripMember; me: boolean };

/** 멤버 한 줄 — 아바타 44 · 이름(나면 「(나)」) · 오른쪽 방장 / 멤버 */
function MemberRow({ member, me }: MemberRowProps) {
  const name = member.profile.display_name ?? "이름 없음";
  return (
    <li className="flex h-16 items-center gap-3.5">
      <Avatar className="size-11">
        <AvatarImage src={member.profile.avatar_url ?? undefined} alt="" />
        <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-base font-bold text-ink-900">
        {name}
        {me && <span className="font-medium text-ink-350"> (나)</span>}
      </span>
      <span className="shrink-0 text-[13px] text-ink-400">
        {member.role === "owner" ? "방장" : "멤버"}
      </span>
    </li>
  );
}
