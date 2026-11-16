import { cleanCaption, type VisitPhoto, visitVideoOf } from "@/entities/schedule-item";

/** 기록 창의 영상 하나 — 저장된 영상은 줄의 값, 새 영상은 고를 때 읽은 값 */
export type DraftVideo = {
  /** 길이(초) */
  duration: number;
  /** 표지로 쓴 지점(초) */
  posterAt: number;
  /** 새 영상만 — 표지 사진(JPEG)과 바로 재생할 주소(object URL). 저장된 영상은 null(재생할 때 읽기 주소를 받는다) */
  local: { poster: Blob; src: string } | null;
  /** 저장된 영상의 표지를 바꿨으면 새 표지 사진(JPEG), 아니면 null. 새 영상은 local.poster 를 바꾼다 */
  cover: Blob | null;
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
      video: video && {
        duration: video.duration,
        posterAt: video.posterAt,
        local: null,
        cover: null,
      },
    };
  });
}

/** 저장할 때 할 일 — 지울 줄 · 설명을 바꿀 줄 · 자리를 옮길 줄 · 표지를 바꿀 영상 · 올릴 새 사진 · 영상(놓을 순서까지) */
export type PhotoChanges = {
  removed: VisitPhoto[];
  captions: { id: string; caption: string | null }[];
  moves: { id: string; position: number }[];
  /** 표지를 바꾼 저장된 영상 — 화면 key · 줄 · 새 표지 · 그 장면(초) */
  covers: { key: string; row: VisitPhoto; poster: Blob; posterAt: number }[];
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
 * 저장된 사진과 고친 값의 차이. 순서를 바꾸지 않았으면 새 사진은 남은 사진 뒤에 고른 순서대로 놓는다(남은 사진의 순서 값은 그대로).
 * 순서를 바꿨으면(「대표로 설정」) 모두 놓인 자리(0부터)로 다시 매긴다 — 열 때 본 값과 같아도 모두 쓴다
 * (그사이 일행이 순서를 바꿨으면 그 값이 남아 내 순서와 섞인다. 나중 저장이 순서 전체를 이긴다).
 * 올린 새 사진은 saved 를 채워 두므로, 실패한 뒤 다시 저장해도 두 번 올리지 않는다
 */
export function photoChanges(
  saved: readonly VisitPhoto[],
  draft: readonly DraftPhoto[],
): PhotoChanges {
  const kept = new Set(draft.flatMap((d) => (d.saved ? [d.saved.id] : [])));
  const last = Math.max(-1, ...draft.flatMap((d) => (d.saved ? [d.saved.position] : [])));
  const renumber = reordered(saved, draft);
  const added = draft.flatMap((d, i) => (d.file && !d.saved ? [{ d, i }] : []));
  return {
    removed: saved.filter((p) => !kept.has(p.id)),
    captions: draft.flatMap((d) => {
      const caption = cleanCaption(d.caption);
      return d.saved && caption !== d.saved.caption ? [{ id: d.saved.id, caption }] : [];
    }),
    moves: renumber
      ? draft.flatMap((d, i) => (d.saved ? [{ id: d.saved.id, position: i }] : []))
      : [],
    covers: draft.flatMap((d) =>
      d.saved && d.video?.cover
        ? [{ key: d.key, row: d.saved, poster: d.video.cover, posterAt: d.video.posterAt }]
        : [],
    ),
    added: added.map(({ d, i }, n) => ({
      key: d.key,
      file: d.file as File,
      caption: cleanCaption(d.caption),
      position: renumber ? i : last + 1 + n,
      video: d.video,
    })),
  };
}

/** 처음 놓인 순서(열 때 본 사진 → 그 뒤에 새로 붙인 것)와 지금 순서가 다른가 — 「대표로 설정」 으로 옮겼다 */
function reordered(saved: readonly VisitPhoto[], draft: readonly DraftPhoto[]): boolean {
  const opened = new Set(saved.map((p) => p.id));
  const order = draft.map((d) => d.saved?.id ?? d.key);
  const natural = [
    ...saved.flatMap((p) => (order.includes(p.id) ? [p.id] : [])),
    ...order.filter((id) => !opened.has(id)),
  ];
  return natural.some((id, i) => id !== order[i]);
}

/** 고른 장면을 그 영상의 표지로 — 새 영상은 올릴 표지를, 저장된 영상은 바꿀 표지를 바꾼다. 영상이 아니면 그대로 */
export function withCover(d: DraftPhoto, at: number, frame: Blob, preview: string): DraftPhoto {
  if (!d.video) return d;
  const { local } = d.video;
  const video = local
    ? { ...d.video, posterAt: at, local: { ...local, poster: frame } }
    : { ...d.video, posterAt: at, cover: frame };
  return { ...d, preview, video };
}

/** 고른 것을 맨 앞(대표)으로 옮긴다 — 나머지는 순서 그대로 */
export function toFront<T>(list: readonly T[], i: number): T[] {
  return [list[i], ...list.filter((_, j) => j !== i)];
}

/** 저장할 사진 일이 있는가 */
export function hasPhotoChanges(c: PhotoChanges): boolean {
  return (
    c.removed.length + c.captions.length + c.moves.length + c.covers.length + c.added.length > 0
  );
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

/** 고른 파일을 읽은 결과 — 받은 것 · 마지막으로 받지 못한 까닭(없으면 null) · 자리가 차서 읽지 않은 파일이 있는가 */
export type PickedFiles<T> = { picked: T[]; refused: string | null; overflow: boolean };

/**
 * 고른 파일을 **받은 수가 남은 자리(room)에 닿을 때까지** 차례로 읽는다. read 는 받으면 그 값, 받지 않으면 까닭(문구)을 돌려준다.
 * 받지 못한 파일은 자리를 쓰지 않는다 — 먼저 자리만큼 자르면 거절된 영상 뒤의 파일이 자리가 있는데도 알림 없이 버려진다
 */
export async function readPicked<T extends object>(
  files: readonly File[],
  room: number,
  read: (file: File) => Promise<T | string>,
): Promise<PickedFiles<T>> {
  const result: PickedFiles<T> = { picked: [], refused: null, overflow: false };
  for (const file of files) {
    if (result.picked.length >= room) {
      result.overflow = true;
      break;
    }
    const r = await read(file);
    if (typeof r === "string") result.refused = r;
    else result.picked.push(r);
  }
  return result;
}
