import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type PersonAvatarProps = { name: string; url: string | null };

/** 표 안의 작은 아바타 22 — 사진이 없으면 이름 첫 글자 */
export function PersonAvatar({ name, url }: PersonAvatarProps) {
  return (
    <Avatar size="sm" className="size-5.5 ring-2 ring-white">
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}
