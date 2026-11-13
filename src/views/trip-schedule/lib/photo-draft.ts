import { cleanCaption, type VisitPhoto, visitVideoOf } from "@/entities/schedule-item";

/** 기록 창의 영상 하나 — 저장된 영상은 줄의 값, 새 영상은 고를 때 읽은 값 */
export type DraftVideo = {
  /** 길이(초) */
  duration: number;
  /** 표지로 쓴 지점(초) */
  posterAt: number;
  /** 새 영상만 — 표지 사진(JPEG)과 바로 재생할 주소(object URL). 저장된 영상은 null(재생할 때 읽기 주소를 받는다) */
  local: { poster: Blob; src: string } | null;
};

/** 기록 창에서 고치는 사진 · 영상 하나 — 저장된 줄이거나 새로 고른 파일 */
export type DraftPhoto = {
  /** 화면 안 key — 저장된 사진은 줄 id, 새 사진은 화면에서 만든 id */
  key: string;
  /** 저장된 줄. 새 사진은 올린 뒤에 채운다 */
  saved: VisitPhoto | null;
  /** 새로 고른 파일(영상이면 원본). 저장된 사진은 null */
  file: File | null;
  /** 새 사진의 미리보기 주소(object URL) — 영상이면 표지 */
  preview: string | null;
  caption: string;
  /** 영상이면 그 값, 사진은 null */
  video: DraftVideo | null;
};

/** 저장된 사진 → 기록 창의 시작 값 */
export function draftOf(photos: readonly VisitPhoto[]): DraftPhoto[] {
  return photos.map((p) => {
    const video = visitVideoOf(p);
    return {
      key: p.id,
      saved: p,
      file: null,
      preview: null,
      caption: p.caption ?? "",
      video: video && { duration: video.duration, posterAt: video.posterAt, local: null },
    };
  });
}

/** 저장할 때 할 일 — 지울 줄 · 설명을 바꿀 줄 · 올릴 새 사진 · 영상(놓을 순서까지) */
export type PhotoChanges = {
  removed: VisitPhoto[];
  captions: { id: string; caption: string | null }[];
  added: {
    key: string;
    file: File;
    caption: string | null;
    position: number;
    /** 영상이면 고를 때 읽은 값(local 이 있다) */
    video: DraftVideo | null;
  }[];
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
      video: d.video,
    })),
  };
}

/** 저장할 사진 일이 있는가 */
export function hasPhotoChanges(c: PhotoChanges): boolean {
  return c.removed.length + c.captions.length + c.added.length > 0;
}

/** 설명 없는 사진 · 영상 수 — 막지는 않고 알려만 준다 */
export function uncaptioned(draft: readonly DraftPhoto[]): number {
  return draft.filter((d) => !cleanCaption(d.caption)).length;
}

/** 라벨 오른쪽 글 — 「5 / 10 · 영상 1 · 설명 없음 2」. 영상 · 설명 없는 것이 없으면 그 조각은 뺀다 */
export function countText(draft: readonly DraftPhoto[], limit: number): string {
  const videos = draft.filter((d) => d.video).length;
  const missing = uncaptioned(draft);
  return [
    `${draft.length} / ${limit}`,
    videos > 0 && `영상 ${videos}`,
    missing > 0 && `설명 없음 ${missing}`,
  ]
    .filter(Boolean)
    .join(" · ");
}
