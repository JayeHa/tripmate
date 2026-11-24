"use client";

import { type ClipboardEvent, useEffect, useState } from "react";

import { MEMO_LINK_MAX } from "@/entities/schedule-item";

import type { NoteDraft } from "../lib/day-memo";
import { linkOf, pastedUrl, pullTypedLinks, typedUrl } from "../lib/memo-links";

/** 「붙여넣은 주소를 링크 카드로 바꿨어요」 를 보이는 시간 */
const NOTICE_MS = 2200;

type SetDraft = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => void;

/**
 * 메모 글 상자 — 글과 링크를 함께 다룬다. 주소를 다 치면(뒤에 공백 · 줄바꿈) 또는 주소 하나만 붙여넣으면
 * 글에서 빼서 링크 카드로(최대 5) 옮기고 잠깐 안내를 띄운다. 「🔗 링크」 는 주소 입력 줄을 연다
 */
export function useMemoEditor(draft: NoteDraft, set: SetDraft) {
  const [notice, setNotice] = useState(0);
  const [linkInput, setLinkInput] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  const full = draft.links.length >= MEMO_LINK_MAX;

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

  return {
    changeText,
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
