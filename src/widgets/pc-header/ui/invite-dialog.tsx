"use client";

import { useUser } from "@/entities/session";
import type { Trip } from "@/entities/trip";
import { MemberList, useTripMembers } from "@/entities/trip-member";
import { InviteLinkCard } from "@/features/trip/invite-member";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

type InviteDialogProps = {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * PC 헤더 「+ 일행초대」 창. 초대 링크(복사 · 공유 · 재발급)와 지금 멤버.
 * 시안은 여행 편집 모달의 초대 단계지만 편집 모달은 여행 홈 단계에서 만든다. 멤버 내보내기는 설정 화면에 있다.
 */
export function InviteDialog({ trip, open, onOpenChange }: InviteDialogProps) {
  const { data: user } = useUser();
  // 창은 닫힘 애니메이션을 위해 마운트해 두고, 멤버는 열었을 때만 불러온다
  const { data: members } = useTripMembers(trip.id, { enabled: open });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 링크가 한 줄로 길어 그리드 칸이 넓어지지 않게 열 최소폭을 0 으로 */}
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-110">
        <DialogHeader>
          <DialogTitle>여행 친구 {members?.length ?? ""}</DialogTitle>
        </DialogHeader>
        <InviteLinkCard trip={trip} />
        {members && (
          <MemberList members={members} currentUserId={user?.id} ownerId={trip.owner_id} />
        )}
      </DialogContent>
    </Dialog>
  );
}
