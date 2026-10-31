"use client";

import { Copy, RefreshCw, Share2 } from "lucide-react";

import { type Trip, useRotateInviteToken } from "@/entities/trip";
import { useInviteLink } from "@/features/trip/invite-member";
import { saveErrorText } from "@/shared/api/sync";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { SettingsCard } from "./settings-card";

type InviteCardProps = {
  trip: Trip;
  onToast: (text: string, detail?: string) => void;
};

/**
 * 일행 초대 카드 — 링크 · 복사 · 공유 · 링크 다시 만들기.
 * 모바일은 다시 만들기가 버튼 줄 끝(44), PC 는 링크 칸 옆(42). 결과는 화면의 토스트로 알린다
 */
export function InviteCard({ trip, onToast }: InviteCardProps) {
  const link = useInviteLink(trip);
  const rotate = useRotateInviteToken(trip.id);

  /** 복사 — 클립보드가 막혀 있으면 실패를 알린다 */
  function copy() {
    link.copy().then(
      () => onToast("초대 링크를 복사했어요"),
      () => onToast("링크를 복사하지 못했어요"),
    );
  }

  /** 공유 시트로 보낸다. 공유를 못 하는 브라우저면 복사하고 알린다 */
  function share() {
    if (typeof navigator.share === "function") void link.share();
    else copy();
  }

  /** 링크 다시 만들기 — 옛 링크는 바로 못 쓰게 된다 */
  function regenerate() {
    rotate.mutate(undefined, {
      onSuccess: () => onToast("새 링크를 만들었어요", "이전 링크는 더 이상 쓸 수 없어요"),
      onError: (e) => onToast(saveErrorText(e, "링크를 다시 만들지 못했어요")),
    });
  }

  const regen = (className: string) => (
    <button
      type="button"
      aria-label="링크 다시 만들기"
      title="링크 다시 만들기"
      disabled={rotate.isPending}
      onClick={regenerate}
      className={cn(
        "shrink-0 items-center justify-center rounded-button text-ink-700 hover:bg-surface-muted disabled:opacity-50",
        className,
      )}
    >
      <RefreshCw className={cn("size-5 lg:size-4.5", rotate.isPending && "animate-spin")} />
    </button>
  );

  return (
    <SettingsCard
      title="일행 초대"
      description="링크를 받은 사람은 Google 로그인 후 이 여행에 참여하고 함께 편집할 수 있어요."
    >
      <div className="flex items-center gap-2">
        <p className="flex h-11 min-w-0 flex-1 items-center truncate rounded-memo bg-surface-muted px-3.5 text-[13px] text-ink-700 lg:h-10.5 lg:px-3">
          <span className="truncate">{link.url}</span>
        </p>
        {regen("hidden size-10.5 lg:flex")}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="chip"
          className="h-11 flex-1 gap-1.5 border-line text-[15px] font-bold text-ink-900 lg:h-10.5 lg:text-sm"
          onClick={copy}
        >
          <Copy className="size-4.25 lg:size-4" />
          <span className="lg:hidden">복사</span>
          <span className="hidden lg:inline">링크 복사</span>
        </Button>
        <Button
          variant="brand"
          className="h-11 flex-1 gap-1.5 text-[15px] font-bold lg:h-10.5 lg:text-sm"
          onClick={share}
        >
          <Share2 className="size-4.25 lg:size-4" />
          공유
        </Button>
        {regen("flex size-11 lg:hidden")}
      </div>
    </SettingsCard>
  );
}
