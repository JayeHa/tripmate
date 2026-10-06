import { useState } from "react";

import { personKey, useTripGuestActions } from "@/entities/expense";

type GuestEditorOptions = {
  tripId: string;
  /** 넣은 인원의 키 — 이 폼의 함께한 사람에 더한다 */
  onAdded: (key: string) => void;
  /** 뺀 인원의 키 — 이 폼에서도 지운다 */
  onRemoved: (key: string) => void;
};

/** 이름을 바꾸는 인원 */
type EditingGuest = { id: string; name: string };

/** 이름 칸 최대 글자 수 — 칩 · 목록에서 한 줄에 들어가게(DB 는 20자까지 받는다) */
export const GUEST_NAME_MAX = 10;

/**
 * 정산 인원 시트의 입력 칸 하나 — 평소엔 「이름만 입력해서 추가」, 연필을 누르면 그 인원의 「이름 바꾸기」.
 * 빼기는 이름 바꾸기 중에만 한다. 비용 · 송금 기록에 쓰인 인원은 DB 가 막고, 그 이유를 칸 아래에 보인다
 */
export function useGuestEditor({ tripId, onAdded, onRemoved }: GuestEditorOptions) {
  const actions = useTripGuestActions(tripId);
  const [editing, setEditing] = useState<EditingGuest | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = actions.add.isPending || actions.rename.isPending || actions.remove.isPending;

  /** 입력 칸을 비우고 「추가」 로 되돌린다 */
  function reset() {
    setEditing(null);
    setName("");
    setError(null);
  }

  /** 이 인원의 이름 바꾸기를 시작한다 */
  function startEdit(guest: EditingGuest) {
    setEditing(guest);
    setName(guest.name);
    setError(null);
  }

  /** 실패 이유를 칸 아래에 */
  function fail(e: Error) {
    setError(e.message);
  }

  /** 추가 또는 이름 저장. 빈 이름은 무시한다 */
  function submit() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    if (editing) {
      actions.rename.mutate(
        { guestId: editing.id, name: trimmed },
        { onSuccess: reset, onError: fail },
      );
      return;
    }
    actions.add.mutate(trimmed, {
      onSuccess: (guest) => {
        reset();
        onAdded(personKey({ kind: "guest", id: guest.id }));
      },
      onError: fail,
    });
  }

  /** 이름 바꾸는 중인 인원을 뺀다 */
  function remove() {
    if (!editing || pending) return;
    const key = personKey({ kind: "guest", id: editing.id });
    actions.remove.mutate(editing.id, {
      onSuccess: () => {
        reset();
        onRemoved(key);
      },
      onError: fail,
    });
  }

  return { editing, name, setName, error, pending, startEdit, reset, submit, remove };
}

export type GuestEditor = ReturnType<typeof useGuestEditor>;
