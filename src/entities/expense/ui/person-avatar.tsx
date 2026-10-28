import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type PersonAvatarProps = {
  name: string;
  /** 프로필 사진. 정산 인원 · 사진이 없으면 null — 이름 첫 글자 */
  url: string | null;
  /** 정산 인원(초대하지 않은 사람) — 첫 글자 바탕이 분홍 */
  guest: boolean;
  /** 크기(`size-7`) 등 바깥 원 */
  className: string;
  /** 첫 글자 칸 — 작은 원의 글자 크기(`text-[8px]`) · 바탕색을 바꿀 때 */
  fallbackClassName?: string;
};

/** 가계부의 사람 — 사진, 없으면 첫 글자(멤버 블루 · 정산 인원 분홍). 목록 · 상세 · 정산 · 입력 폼이 같이 쓴다 */
export function PersonAvatar({
  name,
  url,
  guest,
  className,
  fallbackClassName,
}: PersonAvatarProps) {
  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback
        className={cn(
          "font-extrabold text-white",
          guest ? "bg-guest" : "bg-primary",
          fallbackClassName,
        )}
      >
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
