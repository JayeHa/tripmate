"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

import type { TripMember } from "../model/types";

type Props = {
  members: TripMember[];
  currentUserId?: string;
  ownerId: string;
  onRemove?: (userId: string) => void;
};

export function MemberList({ members, currentUserId, ownerId, onRemove }: Props) {
  const isOwner = currentUserId === ownerId;
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">멤버 {members.length}명</h2>
      <ul className="mt-3 flex flex-col divide-y">
        {members.map((m) => {
          const name = m.profile.display_name ?? "이름 없음";
          const canRemove =
            onRemove && m.user_id !== ownerId && (isOwner || m.user_id === currentUserId);
          return (
            <li key={m.user_id} className="flex items-center gap-3 py-2">
              <Avatar size="sm">
                <AvatarImage src={m.profile.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">
                {name}
                {m.user_id === currentUserId && (
                  <span className="ml-1 text-muted-foreground">(나)</span>
                )}
              </span>
              {m.role === "owner" && <span className="text-xs text-muted-foreground">방장</span>}
              {canRemove && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(m.user_id)}>
                  {m.user_id === currentUserId ? "나가기" : "내보내기"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
