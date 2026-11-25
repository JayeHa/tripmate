"use client";

import { useState } from "react";

import {
  type MemoPhoto,
  memoPhotosOf,
  removeVisitPhotoFiles,
  type ScheduleItem,
  useDeleteScheduleItem,
  useUpdateNote,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { saveErrorText } from "@/shared/api/sync";
import { useMountedDone } from "@/shared/lib/use-mounted-done";

import { type NoteDraft, noteDraftOf, toNotePatch } from "../lib/day-memo";
import { pinnedByOf } from "../lib/memo-draft";
import { droppedKeys, photoFileKeys, photosChanged } from "../lib/memo-photos";
import { usePhotoUpload } from "./use-photo-upload";

/**
 * 날짜 메모 고치기 — 시간(선택) · 글 · 중요 · 홈에 고정 · 링크. 연 때와 달라진 칸만 저장하고, 바뀐 게 없으면 그냥 닫는다. 지우기도 여기서.
 * 시간을 새로 정하면 노선도에서 그 시각 자리로 옮겨 간다(시간을 지우면 자리는 그대로).
 * 사진은 새 것을 먼저 올린 뒤 메모를 고치고, 뺀 사진의 파일은 고친 다음 지운다. 메모를 지우면 그 사진 파일도 지운다.
 * 열릴 때마다 새로 마운트돼 그때 값에서 시작한다
 */
export function useNoteEdit(tripId: string, item: ScheduleItem, onDone: () => void) {
  const [initial] = useState(() => noteDraftOf(item));
  const [draft, setDraft] = useState<NoteDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useUser();
  const update = useUpdateNote(tripId);
  const remove = useDeleteScheduleItem(tripId);
  const photos = usePhotoUpload(tripId);
  const finish = useMountedDone(onDone);
  const pending = update.isPending || remove.isPending || photos.uploading;

  /** 검증해 바뀐 칸만 저장한다 */
  function save() {
    if (pending) return;
    // 고정 칩은 나를 알기 전에는 막혀 있다(pinReady) — 새로 고정하려면 user 가 있다
    const pinnedBy = pinnedByOf(draft.pinned, item.pinned_by, user?.id ?? "");
    const result = toNotePatch(draft, initial, pinnedBy);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    const photosDirty = photosChanged(initial.photos, draft.photos);
    if (Object.keys(result.patch).length === 0 && !photosDirty) {
      onDone();
      return;
    }
    const before = memoPhotosOf(item);
    let after = before;
    const commit = (keys: MemoPhoto[]) => {
      after = keys;
      return update.mutateAsync({
        id: item.id,
        patch: photosDirty ? { ...result.patch, photos: keys } : result.patch,
      });
    };
    void photos.run(draft.photos, commit).then(async (ok) => {
      if (!ok) return;
      // 고친 뒤 — 뺀 사진의 파일(붙은 메모가 없는 것만 버킷이 지운다)
      await removeVisitPhotoFiles(tripId, droppedKeys(before, after));
      finish();
    });
  }

  return {
    draft,
    /** 칸 하나를 고친다 */
    set: <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    save,
    destroy: () => {
      if (pending) return;
      void remove.mutateAsync(item.id).then(
        async () => {
          await removeVisitPhotoFiles(tripId, photoFileKeys(memoPhotosOf(item)));
          finish();
        },
        () => undefined,
      );
    },
    pending,
    /** 「홈에 고정」 을 누를 수 있다 — 고정한 사람(나)을 알아야 적는다 */
    pinReady: !!user,
    canSave: draft.body.trim().length > 0,
    /** 사진을 올리는 중 */
    uploading: photos.uploading,
    /** 사진을 올리거나 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: photos.uploading || [update, remove].some((m) => m.isPending && !m.isPaused),
    error: error ?? photos.error ?? saveFailedText(update.error ?? remove.error),
  };
}

/** 고치기 · 지우기 실패 문구. 실패가 없으면 null */
function saveFailedText(error: Error | null): string | null {
  return error ? saveErrorText(error, "저장하지 못했어요. 잠시 후 다시 시도해 주세요.") : null;
}
