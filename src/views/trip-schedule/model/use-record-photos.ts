"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  addVisitPhoto,
  deleteVisitPhoto,
  updateVisitPhotoCaption,
  VISIT_PHOTO_LIMIT,
  type VisitPhoto,
  VisitPhotoError,
} from "@/entities/schedule-item";
import { ApiError } from "@/shared/api/post-json";
import { queryKeys } from "@/shared/api/query-keys";
import { saveErrorText } from "@/shared/api/sync";

import { draftOf, type DraftPhoto, hasPhotoChanges, photoChanges } from "../lib/photo-draft";

/** 사진 저장 실패 문구 — 우리가 만든 문구는 그대로, 장수 초과는 안내, 오프라인이면 그 안내, 아니면 다시 저장하라고만 */
function photoErrorText(e: unknown): string {
  if (e instanceof VisitPhotoError) return e.message;
  // 서버에 닿지 못했으면(0) 오프라인 안내로 — 그 밖의 서버 문구는 그대로
  if (e instanceof ApiError && e.status !== 0) return e.message;
  if (e instanceof Error && /visit photo limit/.test(e.message)) {
    return `사진은 ${VISIT_PHOTO_LIMIT}장까지 붙일 수 있어요`;
  }
  return saveErrorText(e, "사진을 저장하지 못했어요. 다시 저장해 주세요");
}

/**
 * 기록 창의 사진 — 고친 값(초안) · 고른 사진 · 저장. 열 때의 저장된 사진에서 시작하고, 저장할 때만 올린다.
 * 저장은 지우기 → 설명 바꾸기 → 새 사진 올리기(한 장씩) 순서라 10장 제한에 걸리지 않는다. 올린 새 사진은 바로 초안에 적어,
 * 중간에 실패해 다시 저장해도 두 번 올리지 않는다. 새 사진의 미리보기 주소는 창이 사라질 때 놓는다
 */
export function useRecordPhotos(tripId: string, itemId: string, saved: readonly VisitPhoto[]) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(() => draftOf(saved));
  const [selected, setSelected] = useState(0);
  /** 올리는 중 — 올린 장수 / 올릴 장수. 저장 중이 아니면 null */
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const previews = useRef<string[]>([]);
  useEffect(() => {
    const list = previews.current;
    return () => list.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  /** 고른 파일을 뒤에 붙이고 첫 새 사진을 고른다 — 10장을 넘친 것은 버리고 true */
  function add(files: readonly File[]): boolean {
    const room = Math.max(0, VISIT_PHOTO_LIMIT - draft.length);
    const picked: DraftPhoto[] = files.slice(0, room).map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { key: crypto.randomUUID(), saved: null, file, preview, caption: "" };
    });
    if (picked.length > 0) {
      setDraft([...draft, ...picked]);
      setSelected(draft.length);
    }
    return picked.length < files.length;
  }

  /** i 번째 사진을 뺀다 — 고른 자리는 그 다음 사진(끝이면 앞 사진) */
  function remove(i: number) {
    setDraft(draft.filter((_, j) => j !== i));
    setSelected(Math.max(0, Math.min(i, draft.length - 2)));
  }

  /** i 번째 사진의 설명을 바꾼다 */
  function setCaption(i: number, caption: string) {
    setDraft(draft.map((d, j) => (j === i ? { ...d, caption } : d)));
  }

  /** 올린 새 사진을 초안에 적는다 */
  function markSaved(key: string, row: VisitPhoto) {
    setDraft((ds) => ds.map((d) => (d.key === key ? { ...d, saved: row } : d)));
  }

  /** 바꾼 사진을 저장한다 — 실패하면 화면에 보일 문구, 아니면 null. 끝나면 줄을 다시 읽는다 */
  async function save(): Promise<string | null> {
    const changes = photoChanges(saved, draft);
    if (!hasPhotoChanges(changes)) return null;
    const total = changes.added.length;
    setProgress({ done: 0, total });
    try {
      for (const p of changes.removed) await deleteVisitPhoto(p);
      for (const c of changes.captions) await updateVisitPhotoCaption(c.id, c.caption);
      for (const [i, a] of changes.added.entries()) {
        markSaved(a.key, await addVisitPhoto({ tripId, itemId, ...a }));
        setProgress({ done: i + 1, total });
      }
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
    progress,
    save,
  };
}

export type RecordPhotos = ReturnType<typeof useRecordPhotos>;
