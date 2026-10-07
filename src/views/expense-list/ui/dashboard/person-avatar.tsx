import type { PersonRef } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type PersonAvatarProps = {
  person: PersonRef;
  name: string;
  /** 프로필 사진. 정산 인원 · 사진이 없으면 null — 이름 첫 글자 */
  url: string | null;
  className: string;
};

/** 정산 줄의 사람 — 사진, 없으면 첫 글자(멤버 블루 · 정산 인원 분홍) */
export function PersonAvatar({ person, name, url, className }: PersonAvatarProps) {
  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback
        className={cn(
          "font-extrabold text-white",
          person.kind === "guest" ? "bg-guest" : "bg-primary",
        )}
      >
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
