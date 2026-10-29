"use client";

import { useState } from "react";

import type { Trip } from "@/entities/trip";

/** 「복사했어요」 를 보이는 시간 */
const COPIED_MS = 1500;

/**
 * 여행 초대 링크 — 주소 · 복사 · 다른 앱으로 보내기(Web Share, 안 되면 복사).
 * 주소는 브라우저에서만 만든다(서버 렌더에서는 빈 값)
 */
export function useInviteLink(trip: Trip) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/join/${trip.invite_token}` : "";

  /** 링크를 복사하고 잠깐 「복사했어요」 */
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  }

  /** 공유 시트로 보낸다. 사용자가 시트를 닫아도 오류로 보지 않는다 */
  async function share() {
    if (!navigator.share) return copy();
    await navigator.share({ title: `${trip.title} 여행에 초대합니다`, url }).catch(() => undefined);
  }

  return { url, copied, copy, share };
}
