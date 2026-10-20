import type { MemberBadge } from "@/entities/trip-member";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type CheckerAvatarProps = { checker: MemberBadge };

/** 체크한 사람 아바타 22 — 사진, 없으면 이름 첫 글자(블루) */
export function CheckerAvatar({ checker }: CheckerAvatarProps) {
  return (
    <Avatar className="size-5.5 shrink-0" title={`${checker.name} 체크`}>
      {checker.avatarUrl && <AvatarImage src={checker.avatarUrl} alt="" />}
      <AvatarFallback className="bg-primary text-[10px] font-extrabold text-white">
        {checker.name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
