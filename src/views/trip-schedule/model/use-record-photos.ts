"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  readVisitVideo,
  VISIT_PHOTO_LIMIT,
  type VisitPhoto,
  VisitPhotoError,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { ApiError } from "@/shared/api/post-json";
import { queryKeys } from "@/shared/api/query-keys";
import { saveErrorText } from "@/shared/api/sync";

import { draftOf, type DraftPhoto, hasPhotoChanges, photoChanges } from "../lib/photo-draft";
import { applyPhotoRows, uploadAdded } from "./record-photo-save";

/** 10개를 넘겼을 때 문구 */
const LIMIT_TEXT = `사진 · 영상은 ${VISIT_PHOTO_LIMIT}개까지 붙일 수 있어요`;

/** 사진 저장 실패 문구 — 우리가 만든 문구는 그대로, 개수 초과는 안내, 오프라인이면 그 안내, 아니면 다시 저장하라고만 */
function photoErrorText(e: unknown): string {
  if (e instanceof VisitPhotoError) return e.message;
  // 서버에 닿지 못했으면(0) 오프라인 안내로 — 그 밖의 서버 문구는 그대로
  if (e instanceof ApiError && e.status !== 0) return e.message;
  if (e instanceof Error && /visit photo limit/.test(e.message)) return LIMIT_TEXT;
  return saveErrorText(e, "사진 · 영상을 저장하지 못했어요. 다시 저장해 주세요");
}

/** 고른 파일을 받지 못한 까닭 — 우리가 만든 문구는 그대로 */
function pickErrorText(e: unknown): string {
  return e instanceof VisitPhotoError ? e.message : "이 영상은 올릴 수 없어요";
}

/**
 * 기록 창의 사진 · 영상 — 고친 값(초안) · 고른 것 · 저장. 열 때의 저장된 사진에서 시작하고, 저장할 때만 올린다.
 * saved 는 **창을 열 때 본 사진**이어야 한다 — 사진은 일행이 함께 올려서, 지금 값을 넘기면 그사이 일행이 올린 사진을 뺀 것으로 보고 지운다.
 * 영상은 **고를 때** 종류 · 크기 · 길이를 확인하고 표지를 만든다(reading) — 받지 않는 영상은 초안에 들지 않는다.
 * 저장은 **파일 먼저** — 새 것을 모두 올린 뒤에야 줄을 고친다(지우기 → 설명 → 넣기. 그사이 일행이 올려 10개를 넘으면 넣기가 거부되고 문구를 돌려준다).
 * 형식 · 크기 · 업로드 실패는 기존 사진을 건드리기 전에 나서, 그때 「취소」 하면 정말 아무것도 바뀌지 않는다.
 * 뺀 것의 파일은 줄을 지운 뒤 마지막에 지운다. 붙인 새 것은 바로 초안에 적어 다시 저장해도 두 번 올리지 않는다.
 * 미리보기 · 재생 주소(object URL)는 창이 사라질 때 놓는다
 */
export function useRecordPhotos(tripId: string, itemId: string, saved: readonly VisitPhoto[]) {
  const qc = useQueryClient();
  // 둘러보기는 영상을 올리지 못한다 — 여기서는 미리 알리기만 하고, 막는 것은 서버다(라우트 · 버킷 정책)
  const anonymous = useUser().data?.is_anonymous === true;
  const [draft, setDraft] = useState(() => draftOf(saved));
  const [selected, setSelected] = useState(0);
  /** 고른 영상을 읽는 중 — 그동안 사진 칸을 막는다(초안이 바뀌지 않게) */
  const [reading, setReading] = useState(false);
  /** 올리는 중 — 올린 수 / 올릴 수. 저장 중이 아니면 null */
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const list = objectUrls.current;
    return () => list.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  /** 파일을 볼 주소(object URL)를 만들고, 창이 사라질 때 놓게 적어 둔다 */
  function objectUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    objectUrls.current.push(url);
    return url;
  }

  /** 고른 파일 하나 → 초안. 영상은 확인하고 표지를 만든다 — 받지 않으면 던진다 */
  async function draftOfFile(file: File): Promise<DraftPhoto> {
    const base = { key: crypto.randomUUID(), saved: null, file, caption: "" };
    if (!file.type.startsWith("video/")) return { ...base, preview: objectUrl(file), video: null };
    if (anonymous) throw new VisitPhotoError("둘러보기에서는 영상을 올릴 수 없어요");
    const src = objectUrl(file);
    const { duration, posterAt, poster } = await readVisitVideo(file, src);
    const video = { duration, posterAt, local: { poster, src } };
    return { ...base, preview: objectUrl(poster), video };
  }

  /**
   * 고른 파일을 뒤에 붙이고 첫 새 것을 고른다. 10개를 넘친 것 · 받지 않는 영상은 버리고 알릴 문구를 돌려준다(없으면 null)
   */
  async function add(files: readonly File[]): Promise<string | null> {
    const room = Math.max(0, VISIT_PHOTO_LIMIT - draft.length);
    setReading(true);
    const read: (DraftPhoto | string)[] = [];
    for (const file of files.slice(0, room)) {
      read.push(await draftOfFile(file).catch(pickErrorText));
    }
    setReading(false);
    const picked = read.filter((r) => typeof r !== "string");
    if (picked.length > 0) {
      setDraft([...draft, ...picked]);
      setSelected(draft.length);
    }
    const refused = read.findLast((r) => typeof r === "string");
    return refused ?? (files.length > room ? LIMIT_TEXT : null);
  }

  /** i 번째를 뺀다 — 고른 자리는 그 다음 것(끝이면 앞의 것) */
  function remove(i: number) {
    setDraft(draft.filter((_, j) => j !== i));
    setSelected(Math.max(0, Math.min(i, draft.length - 2)));
  }

  /** i 번째의 설명을 바꾼다 */
  function setCaption(i: number, caption: string) {
    setDraft(draft.map((d, j) => (j === i ? { ...d, caption } : d)));
  }

  /** 올린 새 것을 초안에 적는다 */
  function markSaved(key: string, row: VisitPhoto) {
    setDraft((ds) => ds.map((d) => (d.key === key ? { ...d, saved: row } : d)));
  }

  /** 바꾼 사진 · 영상을 저장한다 — 실패하면 화면에 보일 문구, 아니면 null. 끝나면 줄을 다시 읽는다 */
  async function save(): Promise<string | null> {
    const changes = photoChanges(saved, draft);
    if (!hasPhotoChanges(changes)) return null;
    const total = changes.added.length;
    setProgress({ done: 0, total });
    try {
      const uploaded = await uploadAdded(tripId, changes.added, (done) =>
        setProgress({ done, total }),
      );
      await applyPhotoRows({ tripId, itemId }, changes, uploaded, markSaved);
      return null;
    } catch (e) {
      return photoErrorText(e);
    } finally {
      await qc.invalidateQueries({ queryKey: queryKeys.visitPhotos(tripId), exact: true });
      setProgress(null);
    }
  }

  return {
    draft,
    selected,
    select: setSelected,
    add,
    remove,
    setCaption,
    /** 저장할 사진 일이 있다 */
    changed: hasPhotoChanges(photoChanges(saved, draft)),
    reading,
    progress,
    save,
  };
}

export type RecordPhotos = ReturnType<typeof useRecordPhotos>;
