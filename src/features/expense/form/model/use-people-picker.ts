import { useState } from "react";

import { liveParticipants, livePayer } from "../lib/live-people";

/** 폼에서 고르는 사람 한 명 — 멤버 또는 정산 인원(guest) */
export type FormPerson = {
  /** `personKey` 로 만든 키(`m:…` · `g:…`) */
  key: string;
  name: string;
  guest: boolean;
  avatarUrl: string | null;
};

type PeoplePickerOptions = {
  /** 고를 수 있는 사람 — 이 순서로 칩을 그리고 함께한 사람도 이 순서로 둔다 */
  people: FormPerson[];
  me: string;
  /** participants 가 null 이면 「모두」 — 손대기 전까지 사람 목록을 따라간다 */
  start: { payer: string | null; splitEach: boolean; participants: string[] | null };
};

/**
 * 결제한 사람(한 명) · 「각자 냄」 · 함께한 사람(여러 명).
 * 「각자 냄」 을 켜도 고른 결제자는 기억해 두었다가 끄면 되돌린다(처음부터 각자 냄이었으면 나).
 * 새 비용의 함께한 사람은 손대기 전까지 사람 목록 전체를 따라간다 — 정산 인원이 늦게 읽혀도 빠지지 않는다.
 * 함께한 사람은 한 명 아래로 줄지 않는다 — 마지막 한 명은 빼지 못한다. 「모두」 를 끄면 나만 남는다
 */
export function usePeoplePicker({ people, me, start }: PeoplePickerOptions) {
  const [chosenPayer, setChosenPayer] = useState(start.payer);
  const [splitEach, setSplitEach] = useState(start.splitEach);
  const [picked, setPicked] = useState(start.participants);

  const everyone = people.map((p) => p.key);
  // 그사이 일행이 뺀 정산 인원은 고른 값에서 걸러 보인다(저장도 이 값) — 없는 인원으로 저장해 FK 에 걸리지 않게.
  // 고른 값 자체는 두므로, 기기에 저장된 옛 목록으로 먼저 열렸다 새 목록이 와도 사라지지 않는다
  const participants = picked ? liveParticipants(picked, everyone, me) : everyone;
  const payer = splitEach ? null : livePayer(chosenPayer, everyone, me);
  const allIn = people.every((p) => participants.includes(p.key));

  /** 사람 순서대로 정리한다 — 목록에 없는 키(옛 기록)는 뒤에 둔다 */
  function ordered(keys: string[]) {
    const known = everyone.filter((key) => keys.includes(key));
    return [...known, ...keys.filter((key) => !known.includes(key))];
  }

  /** 결제한 사람을 고른다 — 「각자 냄」 은 꺼진다 */
  function pickPayer(key: string) {
    setChosenPayer(key);
    setSplitEach(false);
  }

  /** 「각자 냄」 을 켜고 끈다 */
  function toggleSplitEach() {
    if (splitEach && chosenPayer === null) setChosenPayer(me);
    setSplitEach(!splitEach);
  }

  /** 함께한 사람에 넣거나 뺀다. 마지막 한 명은 빼지 않는다 */
  function toggleParticipant(key: string) {
    if (!participants.includes(key)) setPicked(ordered([...participants, key]));
    else if (participants.length > 1) setPicked(participants.filter((k) => k !== key));
  }

  /** 새로 넣은 정산 인원을 함께한 사람에 더한다 — 「모두」(목록을 따라감)면 이미 들어 있다 */
  function include(key: string) {
    if (picked && !picked.includes(key)) setPicked(ordered([...picked, key]));
  }

  /** 뺀 정산 인원을 이 폼에서도 지운다 — 결제자였으면 나로, 함께한 사람이 비면 나만 */
  function forget(key: string) {
    if (chosenPayer === key) setChosenPayer(me);
    if (!picked) return;
    const rest = picked.filter((k) => k !== key);
    setPicked(rest.length > 0 ? rest : [me]);
  }

  /** 「모두」 — 켜져 있으면 나만 남기고, 아니면 모두 넣는다 */
  function toggleAll() {
    setPicked(allIn ? [me] : null);
  }

  return {
    payer,
    splitEach,
    participants,
    allIn,
    pickPayer,
    toggleSplitEach,
    toggleParticipant,
    toggleAll,
    include,
    forget,
  };
}

export type PeoplePicker = ReturnType<typeof usePeoplePicker>;
