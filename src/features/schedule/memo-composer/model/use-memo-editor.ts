"use client";

import { type ClipboardEvent, useEffect, useRef, useState } from "react";

import { MEMO_LINK_MAX, MEMO_PHOTO_MAX } from "@/entities/schedule-item";

import type { NoteDraft } from "../lib/day-memo";
import { linkOf, pastedUrl, pullTypedLinks, typedUrl } from "../lib/memo-links";
import type { DraftMemoPhoto } from "../lib/memo-photos";

/** 「붙여넣은 주소를 링크 카드로 바꿨어요」 를 보이는 시간 */
const NOTICE_MS = 2200;

type SetDraft = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => void;

/**
 * 메모 글 상자 — 글 · 링크 · 사진을 함께 다룬다. 주소를 다 치면(뒤에 공백 · 줄바꿈) 또는 주소 하나만 붙여넣으면
 * 글에서 빼서 링크 카드로(최대 5) 옮기고 잠깐 안내를 띄운다. 「🔗 링크」 는 주소 입력 줄을 연다.
 * 「📷 사진」 으로 고른 사진은 기기 안 미리보기만 만들고(올리기는 저장할 때) 10장을 넘친 것은 버리고 알린다.
 * 미리보기 주소(object URL)는 창이 사라질 때 놓는다
 */
export function useMemoEditor(draft: NoteDraft, set: SetDraft) {
  const [notice, setNotice] = useState(0);
  const [linkInput, setLinkInput] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const full = draft.links.length >= MEMO_LINK_MAX;
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const previews = useRef<string[]>([]);
  useEffect(() => {
    const list = previews.current;
    return () => list.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(0), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  /** 글을 바꾼다 — 다 친 주소는 링크로 */
  function changeText(text: string) {
    const pulled = pullTypedLinks(text, draft.links);
    set("body", pulled.text);
    if (pulled.added === 0) return;
    set("links", pulled.links);
    setNotice(Date.now());
  }

  /** 주소 하나만 붙여넣으면 글에 넣지 않고 링크로 */
  function paste(e: ClipboardEvent) {
    const url = pastedUrl(e.clipboardData.getData("text"));
    if (!url || full) return;
    e.preventDefault();
    if (!draft.links.some((l) => l.url === url)) set("links", [...draft.links, linkOf(url)]);
    setNotice(Date.now());
  }

  /** 링크 입력 줄의 「추가」 — 주소가 틀리면 줄을 빨갛게 */
  function addTyped() {
    const url = typedUrl(linkInput ?? "");
    if (!url) {
      setLinkError(true);
      return;
    }
    if (!draft.links.some((l) => l.url === url)) set("links", [...draft.links, linkOf(url)]);
    setLinkInput(null);
    setLinkError(false);
  }

  /** 고른 사진을 뒤에 붙인다 — 남은 자리만큼, 넘친 것은 알린다 */
  function addPhotos(files: readonly File[]) {
    const room = Math.max(0, MEMO_PHOTO_MAX - draft.photos.length);
    const taken = files.slice(0, room).map((file): DraftMemoPhoto => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { id: preview, saved: null, file, preview };
    });
    if (taken.length > 0) set("photos", [...draft.photos, ...taken]);
    setPhotoNotice(files.length > room ? `사진은 ${MEMO_PHOTO_MAX}장까지 붙일 수 있어요` : null);
  }

  return {
    changeText,
    addPhotos,
    removePhoto: (id: string) => {
      set(
        "photos",
        draft.photos.filter((p) => p.id !== id),
      );
      setPhotoNotice(null);
    },
    /** 사진을 더 붙일 수 없다(10장) */
    photosFull: draft.photos.length >= MEMO_PHOTO_MAX,
    /** 넘친 사진을 버렸다는 안내. 없으면 null */
    photoNotice,
    paste,
    /** 안내 「붙여넣은 주소를 링크 카드로 바꿨어요」 를 보일 때 */
    notice: notice > 0,
    /** 링크가 다섯 개라 더 붙일 수 없다 */
    full,
    removeLink: (url: string) =>
      set(
        "links",
        draft.links.filter((l) => l.url !== url),
      ),
    /** 링크 입력 줄의 값. 닫혀 있으면 null */
    linkInput,
    openLinkInput: () => setLinkInput((v) => v ?? ""),
    changeLinkInput: (v: string) => {
      setLinkInput(v);
      setLinkError(false);
    },
    closeLinkInput: () => {
      setLinkInput(null);
      setLinkError(false);
    },
    linkError,
    addTyped,
  };
}
