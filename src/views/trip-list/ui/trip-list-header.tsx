import { initialOfName, type MyProfile } from "@/entities/session";
import { AccountMenu } from "@/features/account-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Wordmark } from "@/shared/ui/wordmark";

type TripListHeaderProps = {
  profile: MyProfile | null | undefined;
  /** 모바일 아바타를 누르면 계정 바텀시트를 연다 */
  onOpenAccount: () => void;
};

/** 내 여행 헤더. 모바일(5a)은 워드마크 + Avatar 32, PC(6a)는 64px 에 「아바타 이름 ▾」 드롭다운 */
export function TripListHeader({ profile, onOpenAccount }: TripListHeaderProps) {
  return (
    <>
      <header className="flex h-13 shrink-0 items-center justify-between px-5 lg:hidden">
        <Wordmark className="text-[22px]" />
        <button type="button" aria-label="내 계정" onClick={onOpenAccount}>
          <Avatar>
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{initialOfName(profile?.display_name)}</AvatarFallback>
          </Avatar>
        </button>
      </header>
      <header className="hidden h-16 shrink-0 items-center justify-between border-b border-divider px-7 lg:flex">
        <Wordmark className="text-[22px]" />
        <AccountMenu profile={profile} />
      </header>
    </>
  );
}
