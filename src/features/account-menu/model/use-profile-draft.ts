"use client";

import { useEffect, useState } from "react";

import {
  AVATAR_MAX_BYTES,
  AVATAR_SIDE,
  type AvatarChange,
  isAvatarMime,
  isValidDisplayName,
  type MyProfile,
} from "@/entities/session";
import { compressImage } from "@/shared/lib/compress-image";

/** 고른 사진을 쓸 수 없을 때 */
const UNREADABLE = "이 사진은 쓸 수 없어요. JPG · PNG 사진으로 골라 주세요.";

/**
 * 내 정보 수정의 고치는 중인 값 — 이름과 사진. 사진은 고르는 순간 긴 변 512 로 줄여 미리 보이고, 저장할 때 올린다.
 * 「기본 이미지로」 는 가입 때 받은 구글 사진(없으면 이니셜)으로. 브라우저가 읽지 못한 사진(Chrome 의 HEIC 등)은 받지 않는다
 */
export function useProfileDraft(profile: MyProfile | null | undefined) {
  const current = profile?.display_name ?? "";
  const [name, setName] = useState(current);
  const [avatar, setAvatar] = useState<AvatarChange>({ kind: "keep" });
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  // 미리보기 주소는 바뀌거나 화면을 떠날 때 놓는다
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  /** 사진을 골랐다 — 줄여서 미리 보인다 */
  async function pick(file: File) {
    setReading(true);
    setPhotoError(null);
    try {
      const blob = await compressImage(file, AVATAR_SIDE);
      if (!isAvatarMime(blob.type) || blob.size > AVATAR_MAX_BYTES) {
        setPhotoError(UNREADABLE);
        return;
      }
      setAvatar({ kind: "upload", file: blob });
      setPreview(URL.createObjectURL(blob));
    } finally {
      setReading(false);
    }
  }

  /** 「기본 이미지로」 */
  function reset() {
    setAvatar({ kind: "default" });
    setPreview(null);
    setPhotoError(null);
  }

  const defaultUrl = profile?.default_avatar_url ?? null;
  const shown = shownAvatar(avatar, preview, profile);
  const trimmed = name.trim();
  const photoChanged =
    avatar.kind === "upload" || (avatar.kind === "default" && profile?.avatar_url !== defaultUrl);
  return {
    name,
    setName,
    trimmed,
    validName: isValidDisplayName(name),
    changed: trimmed !== current || photoChanged,
    avatar,
    /** 지금 보이는 사진 주소. null 이면 이니셜 */
    shown,
    /** 「기본 이미지로」 를 보일지 — 기본 사진이 아닌 것이 보일 때 */
    canReset: shown !== defaultUrl,
    pick: (file: File) => void pick(file),
    reset,
    photoError,
    reading,
  };
}

/** 지금 보이는 사진 — 새로 고른 미리보기 · 기본 사진 · 저장된 사진 */
function shownAvatar(
  avatar: AvatarChange,
  preview: string | null,
  profile: MyProfile | null | undefined,
): string | null {
  if (avatar.kind === "upload") return preview;
  if (avatar.kind === "default") return profile?.default_avatar_url ?? null;
  return profile?.avatar_url ?? null;
}
