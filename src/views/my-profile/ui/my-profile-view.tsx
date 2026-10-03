"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DISPLAY_NAME_MAX,
  initialOfName,
  isValidDisplayName,
  useMyProfile,
  useUpdateDisplayName,
} from "@/entities/session";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

/** 내 정보 — 이름 변경 (시안 11b). */
export function MyProfileView() {
  const { data: profile, isPending } = useMyProfile();

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex h-13 shrink-0 items-center px-[18px]">
        <Link href="/trips" aria-label="뒤로" className="flex text-ink-900">
          <ArrowLeft className="size-6" strokeWidth={2} />
        </Link>
      </header>
      {isPending ? (
        <div className="flex flex-col items-center gap-11 px-6 pt-9">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        // 프로필이 바뀌면 입력값을 새로 시작하도록 key 로 다시 그린다
        <NameForm key={profile?.display_name ?? ""} current={profile?.display_name ?? ""} />
      )}
    </main>
  );
}

function NameForm({ current }: { current: string }) {
  const router = useRouter();
  const update = useUpdateDisplayName();
  const [draft, setDraft] = useState(current);

  const trimmed = draft.trim();
  const valid = isValidDisplayName(draft);
  const changed = trimmed !== current;
  const invalidShown = trimmed.length > 0 && !valid;

  function save() {
    if (!valid || !changed || update.isPending) return;
    update.mutate(draft, { onSuccess: () => router.replace("/trips") });
  }

  return (
    <div className="flex flex-col items-center px-6 pt-9">
      <Avatar className="size-24">
        <AvatarFallback className="text-[34px]">{initialOfName(draft || current)}</AvatarFallback>
      </Avatar>

      <div className="mt-11 flex w-full items-center gap-2 border-b border-line pb-3">
        <span className="w-6 shrink-0" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          maxLength={DISPLAY_NAME_MAX}
          placeholder="이름"
          aria-label="이름"
          className="min-w-0 flex-1 bg-transparent text-center text-2xl font-extrabold text-ink-900 outline-none"
        />
        {draft ? (
          <button
            type="button"
            aria-label="지우기"
            onClick={() => setDraft("")}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-line"
          >
            <X className="size-[13px] text-white" strokeWidth={3} />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
      </div>

      <Button
        size="cta"
        className="mt-5 w-full rounded-button"
        disabled={!valid || !changed || update.isPending}
        onClick={save}
      >
        {update.isPending ? "저장 중…" : "수정완료"}
      </Button>

      <p
        className={`self-start pt-3 text-[13px] ${invalidShown ? "text-destructive" : "text-ink-400"}`}
      >
        {invalidShown
          ? "사용할 수 없는 문자가 있어요."
          : "한글/영어/숫자/밑줄/띄어쓰기를 사용할 수 있습니다."}
      </p>
      {update.error && (
        <p className="self-start pt-1 text-[13px] text-destructive">{update.error.message}</p>
      )}
    </div>
  );
}
