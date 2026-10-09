"use client";

import { ArrowLeft } from "lucide-react";

import { DISPLAY_NAME_MAX, type MyProfile, useUpdateProfile } from "@/entities/session";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";

import { accountLabel } from "../lib/account-label";
import { useProfileDraft } from "../model/use-profile-draft";
import { AvatarPicker } from "./avatar-picker";

/** 감싸는 쪽(시트 · 팝오버)의 제목 컴포넌트. 접근성 이름이 그 컨테이너에 연결된다. */
export type TitleComponent = React.ComponentType<{ className?: string; children: React.ReactNode }>;

type ProfileEditorProps = {
  profile: MyProfile | null | undefined;
  Title: TitleComponent;
  onBack: () => void;
};

/**
 * 내 정보 수정 — 아바타 72(누르면 사진 고르기, 둘러보기 계정은 못 바꿈) · 이름 · 로그인 계정(읽기 전용) · 저장.
 * 이름이나 사진이 바뀌면 저장이 켜진다. 저장하면 이름 · 사진을 함께 적고 메뉴로 돌아간다
 */
export function ProfileEditor({ profile, Title, onBack }: ProfileEditorProps) {
  const draft = useProfileDraft(profile);
  const update = useUpdateProfile();
  const ready = !!profile && draft.validName && draft.changed && !draft.reading;

  /** 저장 — 바뀐 것이 있고 이름이 맞을 때만 */
  function save() {
    if (!ready || !profile || update.isPending) return;
    update.mutate(
      { profile, displayName: draft.name, avatar: draft.avatar },
      { onSuccess: onBack },
    );
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4.5">
        <IconButton label="뒤로" onClick={onBack} className="text-ink-900">
          <ArrowLeft className="size-5.5" strokeWidth={2} />
        </IconButton>
        <Title className="text-[17px] font-extrabold text-ink-900">내 정보</Title>
      </div>
      <div className="flex flex-col items-center gap-4.5 px-5 pt-2 pb-6">
        <AvatarPicker
          src={draft.shown}
          name={draft.trimmed || (profile?.display_name ?? "")}
          editable={!!profile?.provider}
          canReset={draft.canReset}
          busy={draft.reading || update.isPending}
          onPick={draft.pick}
          onReset={draft.reset}
        />
        {draft.photoError && <p className="-mt-2 text-xs text-destructive">{draft.photoError}</p>}

        <NameField
          value={draft.name}
          onChange={draft.setName}
          invalid={draft.trimmed.length > 0 && !draft.validName}
          onEnter={save}
        />

        <div className="flex w-full flex-col gap-1.5">
          <span className="text-[13px] font-bold text-ink-700">로그인 계정</span>
          <div className="flex h-12 items-center rounded-memo bg-surface-muted px-3.5 text-[15px] text-ink-500">
            {accountLabel(profile, "paren")}
          </div>
        </div>

        <Button
          className="h-12.5 w-full rounded-button text-base font-bold"
          disabled={!ready || update.isPending}
          onClick={save}
        >
          {update.isPending ? "저장 중…" : "저장"}
        </Button>
        {update.error && <p className="text-[13px] text-destructive">{update.error.message}</p>}
      </div>
    </>
  );
}

type NameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** 쓸 수 없는 글자가 있다 — 안내를 빨간 글로 */
  invalid: boolean;
  onEnter: () => void;
};

/** 이름 칸 — 12자, 아래 안내(쓸 수 없는 글자가 있으면 빨간 글) */
function NameField({ value, onChange, invalid, onEnter }: NameFieldProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">이름</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        maxLength={DISPLAY_NAME_MAX}
        className="h-12 w-full rounded-memo border border-line px-3.5 text-base font-bold text-ink-900 outline-none focus:border-primary"
      />
      <span className={cn("text-xs", invalid ? "text-destructive" : "text-ink-400")}>
        {invalid
          ? "한글·영어·숫자·밑줄·띄어쓰기만 쓸 수 있어요."
          : "일행에게 이 이름으로 보여요. 모든 여행에 같이 바뀌어요."}
      </span>
    </label>
  );
}
