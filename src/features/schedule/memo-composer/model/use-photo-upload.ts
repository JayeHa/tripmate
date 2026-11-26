"use client";

import { useState } from "react";

import {
  type MemoPhoto,
  removeVisitPhotoFiles,
  uploadVisitPhoto,
  VisitPhotoError,
} from "@/entities/schedule-item";
import { ApiError } from "@/shared/api/post-json";
import { saveErrorText } from "@/shared/api/sync";

import { type DraftMemoPhoto, photoFileKeys } from "../lib/memo-photos";

/** 사진을 올리지 못한 까닭 — 우리가 만든 문구 · 서버 문구는 그대로, 아니면 다시 저장하라고만(오프라인이면 그 안내) */
function uploadErrorText(e: unknown): string {
  if (e instanceof VisitPhotoError) return e.message;
  if (e instanceof ApiError && e.status !== 0) return e.message;
  return saveErrorText(e, "사진을 올리지 못했어요. 다시 저장해 주세요");
}

/**
 * 고른 사진을 하나씩 올려 최종 키 목록(창의 순서대로)과 이번에 올린 것을 돌려준다.
 * 한 장씩인 까닭 — 줄이기(canvas)를 열 장 동시에 하면 휴대폰 메모리가 모자랄 수 있다.
 * 하나라도 실패하면 이번에 올린 것을 지우고 던진다 — 메모는 건드리기 전이다
 */
async function uploadAll(
  tripId: string,
  photos: readonly DraftMemoPhoto[],
): Promise<{ keys: MemoPhoto[]; added: MemoPhoto[] }> {
  const keys: MemoPhoto[] = [];
  const added: MemoPhoto[] = [];
  try {
    for (const p of photos) {
      const key = p.saved ?? (await uploadVisitPhoto(tripId, p.file));
      if (!p.saved) added.push(key);
      keys.push(key);
    }
  } catch (e) {
    await removeVisitPhotoFiles(tripId, photoFileKeys(added));
    throw e;
  }
  return { keys, added };
}

/**
 * 메모 저장의 사진 단계 — **파일 먼저**: 새로 고른 사진을 줄여 올린 뒤에야 메모를 저장한다(commit 에 최종 키를 넘긴다).
 * 올리기가 실패하면 메모를 건드리지 않고 문구를 남긴다. 메모 저장이 실패하면 이번에 올린 파일을 지운다
 * (저장이 실제로는 닿았어도 버킷 정책이 메모 칸이 가리키는 파일은 지우지 않는다). 성공하면 true
 */
export function usePhotoUpload(tripId: string) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 사진을 올리고 commit 을 부른다 */
  async function run(
    photos: readonly DraftMemoPhoto[],
    commit: (keys: MemoPhoto[]) => Promise<unknown>,
  ): Promise<boolean> {
    setError(null);
    setUploading(true);
    let uploaded: { keys: MemoPhoto[]; added: MemoPhoto[] };
    try {
      uploaded = await uploadAll(tripId, photos);
    } catch (e) {
      setError(uploadErrorText(e));
      return false;
    } finally {
      setUploading(false);
    }
    try {
      await commit(uploaded.keys);
      return true;
    } catch {
      // 저장 실패 문구는 뮤테이션 오류가 보인다
      await removeVisitPhotoFiles(tripId, photoFileKeys(uploaded.added));
      return false;
    }
  }

  return { run, uploading, error };
}
