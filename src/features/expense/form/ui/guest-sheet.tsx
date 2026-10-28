import { Link2, Pencil } from "lucide-react";
import Link from "next/link";

import { PersonAvatar, personOfKey } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { GUEST_NAME_MAX, type GuestEditor } from "../model/use-guest-editor";
import type { FormPerson } from "../model/use-people-picker";

type GuestSheetProps = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  people: FormPerson[];
  me: string;
  editor: GuestEditor;
};

/**
 * 정산 인원 — 모바일 바텀시트 · PC 가운데 모달. 안내 → 사람 목록(멤버 / 초대 안 함 + 연필) → 이름 칸 → 앱으로 초대하기.
 * 여기서 넣은 사람은 여행 단위라 이 여행의 모든 비용 · 정산에 함께 보인다
 */
export function GuestSheet({ open, onClose, tripId, people, me, editor }: GuestSheetProps) {
  const solo = people.length === 1;
  return (
    <SheetDialog
      open={open}
      onClose={() => {
        editor.reset();
        onClose();
      }}
      title="정산 인원"
      locked={editor.pending}
    >
      <div className="flex flex-col gap-3.5">
        <p className="text-xs/normal text-ink-450">
          {solo
            ? "지금은 혼자 쓰고 있어요. 사람을 추가하면 이 여행의 모든 비용에서 나눠 낼 수 있어요."
            : "여기서 추가한 사람은 이 여행의 모든 비용과 정산에 같이 보여요."}
        </p>
        <ul className="flex max-h-65 flex-col overflow-y-auto">
          {people.map((p) => (
            <PersonRow key={p.key} person={p} isMe={p.key === me} editor={editor} />
          ))}
        </ul>
        <NameInput editor={editor} />
        <Link
          href={`/trips/${tripId}/settings`}
          className="flex h-11 items-center justify-center gap-1.5 rounded-button border border-line-strong text-sm font-bold text-ink-900"
        >
          <Link2 className="size-4" aria-hidden="true" />
          앱으로 초대하기 (링크 공유)
        </Link>
      </div>
    </SheetDialog>
  );
}

type PersonRowProps = { person: FormPerson; isMe: boolean; editor: GuestEditor };

/** 목록 한 줄 — 아바타 32 · 이름 · 배지(멤버 / 초대 안 함), 초대 안 한 인원만 연필 */
function PersonRow({ person, isMe, editor }: PersonRowProps) {
  const id = personOfKey(person.key)?.id ?? "";
  return (
    <li className="flex min-h-13 items-center gap-3 border-b border-surface-muted">
      <PersonAvatar
        name={person.name}
        url={person.avatarUrl}
        guest={person.guest}
        className="size-8"
        fallbackClassName="text-[13px]"
      />
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink-900">
        {person.name}
        {isMe && " (나)"}
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-bold",
          person.guest ? "bg-guest-tag-bg text-guest-tag" : "text-ink-400",
        )}
      >
        {person.guest ? "초대 안 함" : "멤버"}
      </span>
      {person.guest && (
        <button
          type="button"
          aria-label={`${person.name} 이름 바꾸기`}
          onClick={() => editor.startEdit({ id, name: person.name })}
          disabled={editor.pending}
          className="-mr-1.5 flex size-8 items-center justify-center text-ink-400 disabled:opacity-40"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

type NameInputProps = { editor: GuestEditor };

/** 이름 칸 — 「추가」, 이름 바꾸는 중이면 「취소 | 저장」 + 「이 인원 빼기」. 실패 이유는 아래 빨간 글 */
function NameInput({ editor }: NameInputProps) {
  const empty = !editor.name.trim();
  return (
    <div className="flex flex-col gap-1.5">
      {editor.editing && (
        <label htmlFor="guest-name" className="text-[13px] font-bold text-ink-900">
          이름 바꾸기
        </label>
      )}
      <div className="flex gap-1.5">
        <input
          id="guest-name"
          aria-label={editor.editing ? undefined : "정산 인원 이름"}
          value={editor.name}
          maxLength={GUEST_NAME_MAX}
          onChange={(e) => editor.setName(e.target.value)}
          onKeyDown={(e) => {
            // 비용 폼 안의 칸이라 Enter 가 비용 저장으로 가지 않게 막는다
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            editor.submit();
          }}
          placeholder="이름만 입력해서 추가"
          className="h-11 min-w-0 flex-1 rounded-memo border border-input bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-350 focus-visible:border-primary"
        />
        {editor.editing && (
          <button
            type="button"
            onClick={editor.reset}
            // 저장 중에 취소하면 끝난 저장이 새로 친 「추가」 칸을 비우거나 오류를 엉뚱한 칸에 띄운다
            disabled={editor.pending}
            className="h-11 rounded-button bg-surface-muted px-3 text-[15px] font-semibold text-ink-700 disabled:opacity-40"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={editor.submit}
          disabled={empty || editor.pending}
          className="h-11 rounded-button bg-primary px-4 text-[15px] font-semibold text-white disabled:bg-primary-disabled"
        >
          {editor.editing ? "저장" : "추가"}
        </button>
      </div>
      {editor.editing && (
        <button
          type="button"
          onClick={editor.remove}
          disabled={editor.pending}
          className="self-start text-xs font-bold text-destructive"
        >
          이 인원 빼기
        </button>
      )}
      {editor.error && (
        <p role="alert" className="text-xs text-destructive">
          {editor.error}
        </p>
      )}
    </div>
  );
}
