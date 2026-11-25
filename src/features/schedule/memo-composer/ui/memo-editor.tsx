"use client";

import { Link2, X } from "lucide-react";

import { linkDomain, MEMO_LINK_MAX, MEMO_MAX, MemoLinkIcon } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { NoteDraft } from "../lib/day-memo";
import type { useMemoEditor } from "../model/use-memo-editor";

type MemoEditorProps = {
  draft: NoteDraft;
  editor: ReturnType<typeof useMemoEditor>;
};

/**
 * 메모 글 상자 — 글(15 · 1.5) 아래로 붙인 것이 있을 때만 첨부 영역(링크 카드로 바꿨다는 안내 · 링크 줄 · 주소 입력 줄),
 * 맨 아래 첨부 바 「🔗 링크」 · 글자 수. 사진은 아직 붙일 수 없다
 */
export function MemoEditor({ draft, editor }: MemoEditorProps) {
  const attached = editor.notice || draft.links.length > 0 || editor.linkInput !== null;
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line focus-within:border-primary">
      <textarea
        value={draft.body}
        onChange={(e) => editor.changeText(e.target.value)}
        onPaste={editor.paste}
        maxLength={MEMO_MAX}
        aria-label="메모"
        placeholder="메모를 입력하세요 · 주소를 붙여넣으면 링크 카드가 돼요"
        className="h-24 w-full resize-none px-3.5 py-3 text-[15px]/normal text-ink-900 outline-none placeholder:text-ink-350 lg:h-33"
      />
      {attached && (
        <div className="flex flex-col gap-1.5 px-3 pb-3">
          {editor.notice && (
            <p role="status" className="text-xs font-bold text-primary">
              🔗 붙여넣은 주소를 링크 카드로 바꿨어요
            </p>
          )}
          {draft.links.map((l) => (
            <LinkRow
              key={l.url}
              title={l.title}
              url={l.url}
              onRemove={() => editor.removeLink(l.url)}
            />
          ))}
          {editor.linkInput !== null && <LinkInput editor={editor} />}
        </div>
      )}
      <div className="flex h-11 items-center border-t border-attach-bar-line bg-surface-faint px-1.5">
        <button
          type="button"
          onClick={editor.openLinkInput}
          disabled={editor.full}
          className="flex h-8 items-center gap-1 rounded-button px-2 text-[13px] font-bold text-ink-700 hover:bg-surface-muted disabled:opacity-40"
        >
          <Link2 aria-hidden="true" className="size-4" />
          링크
          {draft.links.length > 0 && (
            <span className="font-medium text-ink-350">
              {draft.links.length}/{MEMO_LINK_MAX}
            </span>
          )}
        </button>
        <span className="ml-auto pr-2 text-xs text-ink-350 tabular-nums">
          {draft.body.length}/{MEMO_MAX}
        </span>
      </div>
    </div>
  );
}

type LinkRowProps = { title: string; url: string; onRemove: () => void };

/** 붙인 링크 한 줄 — 아이콘 · 제목 · 도메인 · ✕ 지우기 */
function LinkRow({ title, url, onRemove }: LinkRowProps) {
  const domain = linkDomain(url);
  return (
    <div className="flex items-center gap-2 rounded-memo bg-surface-sunken py-1.5 pr-1 pl-2">
      <MemoLinkIcon domain={domain} className="size-7 text-[13px]" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-extrabold text-ink-900">{title || domain}</span>
        <span className="truncate text-[11px] text-ink-350">{domain}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${title || domain} 링크 지우기`}
        className="flex size-8 shrink-0 items-center justify-center text-ink-400"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

type LinkInputProps = { editor: ReturnType<typeof useMemoEditor> };

/** 주소 입력 줄(38) — 「https://」 · 「추가」. Enter 도 추가, Esc 는 닫기 */
function LinkInput({ editor }: LinkInputProps) {
  return (
    <div
      className={cn(
        "flex h-9.5 items-center gap-1 rounded-memo border-[1.5px] bg-white pr-1 pl-3",
        editor.linkError ? "border-destructive" : "border-primary",
      )}
    >
      <input
        // 「🔗 링크」 를 눌러 연 줄이라 바로 친다
        autoFocus
        type="url"
        inputMode="url"
        value={editor.linkInput ?? ""}
        onChange={(e) => editor.changeLinkInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editor.addTyped();
          }
          if (e.key === "Escape") {
            e.stopPropagation();
            editor.closeLinkInput();
          }
        }}
        placeholder="https://"
        aria-label="링크 주소"
        aria-invalid={editor.linkError}
        className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-350"
      />
      <button
        type="button"
        onClick={editor.addTyped}
        className="h-7 shrink-0 rounded-pill-sm px-2.5 text-[13px] font-bold text-primary hover:bg-route-transit-soft"
      >
        추가
      </button>
    </div>
  );
}
