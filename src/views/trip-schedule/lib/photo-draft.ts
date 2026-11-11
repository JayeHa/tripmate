import { cleanCaption, type VisitPhoto } from "@/entities/schedule-item";

/** 기록 창에서 고치는 사진 한 장 — 저장된 사진이거나 새로 고른 파일 */
export type DraftPhoto = {
  /** 화면 안 key — 저장된 사진은 줄 id, 새 사진은 화면에서 만든 id */
  key: string;
  /** 저장된 줄. 새 사진은 올린 뒤에 채운다 */
  saved: VisitPhoto | null;
  /** 새로 고른 파일. 저장된 사진은 null */
  file: File | null;
  /** 새 사진의 미리보기 주소(object URL) */
  preview: string | null;
  caption: string;
};

/** 저장된 사진 → 기록 창의 시작 값 */
export function draftOf(photos: readonly VisitPhoto[]): DraftPhoto[] {
  return photos.map((p) => ({
    key: p.id,
    saved: p,
    file: null,
    preview: null,
    caption: p.caption ?? "",
  }));
}

/** 저장할 때 할 일 — 지울 줄 · 설명을 바꿀 줄 · 올릴 새 사진(놓을 순서까지) */
export type PhotoChanges = {
  removed: VisitPhoto[];
  captions: { id: string; caption: string | null }[];
  added: { key: string; file: File; caption: string | null; position: number }[];
};

/**
 * 저장된 사진과 고친 값의 차이. 새 사진은 남은 사진 뒤에 고른 순서대로 놓는다(남은 사진의 순서 값은 그대로).
 * 올린 새 사진은 saved 를 채워 두므로, 실패한 뒤 다시 저장해도 두 번 올리지 않는다
 */
export function photoChanges(
  saved: readonly VisitPhoto[],
  draft: readonly DraftPhoto[],
): PhotoChanges {
  const kept = new Set(draft.flatMap((d) => (d.saved ? [d.saved.id] : [])));
  const last = Math.max(-1, ...draft.flatMap((d) => (d.saved ? [d.saved.position] : [])));
  const added = draft.flatMap((d) => (d.file && !d.saved ? [d] : []));
  return {
    removed: saved.filter((p) => !kept.has(p.id)),
    captions: draft.flatMap((d) => {
      const caption = cleanCaption(d.caption);
      return d.saved && caption !== d.saved.caption ? [{ id: d.saved.id, caption }] : [];
    }),
    added: added.map((d, i) => ({
      key: d.key,
      file: d.file as File,
      caption: cleanCaption(d.caption),
      position: last + 1 + i,
    })),
  };
}

/** 저장할 사진 일이 있는가 */
export function hasPhotoChanges(c: PhotoChanges): boolean {
  return c.removed.length + c.captions.length + c.added.length > 0;
}

/** 설명 없는 사진 수 — 「설명 없는 사진 N장」(막지는 않고 알려만 준다) */
export function uncaptioned(draft: readonly DraftPhoto[]): number {
  return draft.filter((d) => !cleanCaption(d.caption)).length;
}
