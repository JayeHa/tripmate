/** 두 자리로 */
export const pad2 = (n: number | string) => String(n).padStart(2, "0");

/** 칸에 친 글자를 규칙대로 다듬은 결과. done 이면 그 칸은 다 쳤다(시 → 분 칸으로 넘어간다) */
export type PartInput = { text: string; done: boolean };

/**
 * 시 칸에 친 글자 — 숫자만 두 자리까지. 첫 숫자가 3–9 면 바로 0N(더 칠 수 없다), 0 · 1 · 2 면 둘째를 기다린다.
 * 2 로 시작하면 둘째는 0–3 만 받는다(24 이상을 칠 수 없게)
 */
export function acceptHour(raw: string): PartInput {
  const d = raw.replace(/\D/g, "").slice(0, 2);
  if (d.length === 0) return { text: "", done: false };
  if (d.length === 1)
    return Number(d) >= 3 ? { text: `0${d}`, done: true } : { text: d, done: false };
  if (d.startsWith("2") && Number(d[1]) > 3) return { text: "2", done: false };
  return { text: d, done: true };
}

/** 분 칸에 친 글자 — 숫자만 두 자리까지. 첫 숫자가 6–9 면 바로 0N, 두 자리면 끝 */
export function acceptMinute(raw: string): PartInput {
  const d = raw.replace(/\D/g, "").slice(0, 2);
  if (d.length === 0) return { text: "", done: false };
  if (d.length === 1)
    return Number(d) >= 6 ? { text: `0${d}`, done: true } : { text: d, done: false };
  return { text: d, done: true };
}

/**
 * 붙여넣거나 몰아 친 시간을 시 · 분으로 — 「14:30」 「14 30」 「1430」 「930」(세 자리는 H:MM).
 * 시간 모양이 아니면 null
 */
export function splitTime(text: string): { hour: string; minute: string } | null {
  const t = text.trim();
  const parts = /^(\d{1,2})\D+(\d{1,2})$/.exec(t);
  if (parts) return { hour: parts[1], minute: parts[2] };
  if (/^\d{3,4}$/.test(t)) return { hour: t.slice(0, -2), minute: t.slice(-2) };
  return null;
}

/** 확정 결과 — 저장할 「HH:MM」(""= 시간 없음) 또는 틀린 칸 */
export type TimeCommit = { value: string } | { error: "hour" | "minute" };

/**
 * 칸을 벗어날 때 확정한다. 둘 다 비면 시간 없음, 시가 한 자리면 0N, 시만 있으면 00분.
 * 시가 없는데 분만 있거나 범위(시 00–23 · 분 00–59)를 벗어나면 그 칸 오류
 */
export function commitTime(hour: string, minute: string): TimeCommit {
  if (hour === "" && minute === "") return { value: "" };
  if (hour === "" || Number(hour) > 23) return { error: "hour" };
  if (minute !== "" && Number(minute) > 59) return { error: "minute" };
  return { value: `${pad2(Number(hour))}:${pad2(Number(minute || 0))}` };
}

/** 칸 오류 문구 — 시가 비었으면 시를 치라고, 아니면 범위 */
export function timeErrorText(error: "hour" | "minute", hour: string): string {
  if (error === "minute") return "00–59 사이로 입력해 주세요";
  return hour === "" ? "시를 입력해 주세요" : "00–23 사이로 입력해 주세요";
}

/** ↑↓ 로 한 칸 값을 바꾼다 — 0 ↔ max 를 넘으면 반대쪽으로 돈다(23↔00, 59↔00). 비었으면 0 에서 시작 */
export function stepPart(text: string, delta: number, max: number): string {
  const size = max + 1;
  return pad2((((Number(text || 0) + delta) % size) + size) % size);
}

/** 저장된 「HH:MM」(또는 「HH:MM:SS」)을 두 칸으로. 비었거나 모양이 틀리면 빈 칸 */
export function splitValue(value: string): { hour: string; minute: string } {
  const m = /^(\d{2}):(\d{2})/.exec(value);
  return m ? { hour: m[1], minute: m[2] } : { hour: "", minute: "" };
}
