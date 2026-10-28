"use client";

import { Check, Copy, RefreshCw, Share2 } from "lucide-react";

import { type Trip, useRotateInviteToken } from "@/entities/trip";
import { Button } from "@/shared/ui/button";

import { useInviteLink } from "../model/use-invite-link";

type InviteLinkCardProps = { trip: Trip };

/** 설정 화면의 일행 초대 카드 — 링크 · 복사 · 공유 · 링크 재발급 */
export function InviteLinkCard({ trip }: InviteLinkCardProps) {
  const rotate = useRotateInviteToken(trip.id);
  const { url, copied, copy, share } = useInviteLink(trip);

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">일행 초대</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        링크를 받은 사람은 Google 로그인 후 이 여행에 참여하고 함께 편집할 수 있어요.
      </p>
      <p className="mt-3 truncate rounded-md bg-muted px-3 py-2 font-mono text-xs">{url}</p>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />} {copied ? "복사됨" : "복사"}
        </Button>
        <Button className="flex-1" onClick={() => void share()}>
          <Share2 /> 공유
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="링크 재발급"
          onClick={() => rotate.mutate()}
          disabled={rotate.isPending}
        >
          <RefreshCw className={rotate.isPending ? "animate-spin" : ""} />
        </Button>
      </div>
    </section>
  );
}
