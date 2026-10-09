"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";
import type { Tables } from "@/shared/api/supabase/database.types";

import { removeAvatar, uploadAvatar } from "../api/avatars";

export type MyProfile = Tables<"profiles"> & {
  email: string | null;
  /** 로그인 수단. 둘러보기(익명)면 null. */
  provider: "Google" | null;
};

/** 로그인한 사람 자신의 프로필. 이메일과 로그인 수단은 auth 쪽에만 있어 함께 붙인다. */
export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async (): Promise<MyProfile | null> => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      if (error) throw error;
      return {
        ...data,
        email: auth.user.email ?? null,
        provider: auth.user.is_anonymous ? null : "Google",
      };
    },
  });
}

/** 사진을 어떻게 할지 — 그대로 · 새로 고른 사진(줄인 것) · 기본(가입 때 받은 구글 사진, 없으면 이니셜) */
export type AvatarChange = { kind: "keep" } | { kind: "upload"; file: Blob } | { kind: "default" };

/** 저장한 뒤 avatar_url — 새 사진은 올려서 받은 주소, 기본은 구글 사진 */
async function nextAvatarUrl(
  change: Exclude<AvatarChange, { kind: "keep" }>,
  profile: MyProfile,
): Promise<string | null> {
  return change.kind === "upload" ? uploadAvatar(change.file) : profile.default_avatar_url;
}

/** 지금 DB 의 사진 주소 — 편집기를 연 뒤 다른 기기에서 바뀌었을 수 있어 지울 앞 사진은 여기서 정한다 */
async function currentAvatarUrl(userId: string): Promise<string | null> {
  const { data, error } = await createClient()
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.avatar_url;
}

type ProfileInput = { profile: MyProfile; displayName: string; avatar: AvatarChange };

/**
 * 프로필 저장. 사진을 그대로 두면 이름만 적는다 — 편집기를 연 때의 주소를 다시 쓰면 그사이 다른 기기에서 바꾼 사진을 되돌린다.
 * 사진을 바꾸면 새 주소를 적은 뒤 그 직전 DB 의 사진 파일을 지운다(실패해도 저장은 끝난 것 — 남은 파일은 화면에 쓰이지 않는다)
 */
async function saveProfile({ profile, displayName, avatar }: ProfileInput): Promise<void> {
  const supabase = createClient();
  const name = { display_name: displayName.trim() };
  if (avatar.kind === "keep") {
    const { error } = await supabase.from("profiles").update(name).eq("id", profile.id);
    if (error) throw error;
    return;
  }
  const before = await currentAvatarUrl(profile.id);
  const avatarUrl = await nextAvatarUrl(avatar, profile);
  const { error } = await supabase
    .from("profiles")
    .update({ ...name, avatar_url: avatarUrl })
    .eq("id", profile.id);
  if (error) throw error;
  if (before && before !== avatarUrl) await removeAvatar(before).catch(() => undefined);
}

/** 내 정보 저장 — 이름과 사진을 함께(`saveProfile`). 헤더 · 멤버 · 메모 · 가계부가 다시 읽는다 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveProfile,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myProfile });
      // 멤버 목록(헤더 · 메모 · 가계부 아바타)에도 이름 · 사진이 나온다
      void qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
