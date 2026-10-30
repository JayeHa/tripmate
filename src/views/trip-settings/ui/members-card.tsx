"use client";

import { initialOfName } from "@/entities/session";
import type { TripMember } from "@/entities/trip-member";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import { SettingsCard } from "./settings-card";

type MembersCardProps = {
  members: TripMember[];
  myId: string | undefined;
  ownerId: string;
  /** 방장이 다른 멤버의 「내보내기」 를 눌렀을 때. 방장이 아니면 버튼이 없다 */
  onKick: (member: TripMember) => void;
};

/** 멤버 카드 — 「멤버 N명」, 줄마다 아바타 36 · 이름(나면 「(나)」) · 방장/멤버. 방장에게만 다른 멤버의 「내보내기」 */
export function MembersCard({ members, myId, ownerId, onKick }: MembersCardProps) {
  const iAmOwner = myId === ownerId;
  return (
    <SettingsCard title={`멤버 ${members.length}명`} className="gap-1.5 pb-2 lg:pb-2.5">
      <ul>
        {members.map((m) => (
          <MemberRow
            key={m.user_id}
            member={m}
            me={m.user_id === myId}
            onKick={iAmOwner && m.user_id !== ownerId ? () => onKick(m) : null}
          />
        ))}
      </ul>
    </SettingsCard>
  );
}

type MemberRowProps = { member: TripMember; me: boolean; onKick: (() => void) | null };

/** 멤버 한 줄(56) */
function MemberRow({ member, me, onKick }: MemberRowProps) {
  const name = member.profile.display_name ?? "이름 없음";
  return (
    <li className="flex h-14 items-center gap-3">
      <Avatar className="size-9">
        <AvatarImage src={member.profile.avatar_url ?? undefined} alt="" />
        <AvatarFallback>{initialOfName(name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink-900">
        {name}
        {me && <span className="font-medium text-ink-350"> (나)</span>}
      </span>
      <span className="shrink-0 text-[13px] text-ink-400">
        {member.role === "owner" ? "방장" : "멤버"}
      </span>
      {onKick && (
        <button
          type="button"
          onClick={onKick}
          aria-label={`${name} 내보내기`}
          className="h-7 shrink-0 rounded-pill-sm bg-surface-muted px-2.5 text-xs font-bold text-ink-700"
        >
          내보내기
        </button>
      )}
    </li>
  );
}
