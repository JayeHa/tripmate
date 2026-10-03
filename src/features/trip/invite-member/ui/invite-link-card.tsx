"use client";

import { Check, Copy, RefreshCw, Share2 } from "lucide-react";
import { useState } from "react";

import { type Trip, useRotateInviteToken } from "@/entities/trip";
import { Button } from "@/shared/ui/button";

type InviteLinkCardProps = { trip: Trip };

export function InviteLinkCard({ trip }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const rotate = useRotateInviteToken(trip.id);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/join/${trip.invite_token}` : "";

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    if (navigator.share) {
      await navigator
        .share({ title: `${trip.title} 여행에 초대합니다`, url })
        .catch(() => undefined);
    } else {
      await copy();
    }
  }

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
