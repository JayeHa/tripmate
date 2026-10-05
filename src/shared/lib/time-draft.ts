/** 시간 선택 창에서 고르는 중인 값. 아직 안 골랐으면 null */
export type TimeDraft = { h: number | null; m: number | null };

const pad = (n: number) => String(n).padStart(2, "0");

/** 「HH:mm」(또는 「HH:mm:ss」)을 시 · 분으로. 비었거나 모양이 틀리면 둘 다 null */
export function parseTime(value: string | null | undefined): TimeDraft {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? "");
  if (!match) return { h: null, m: null };
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? { h, m } : { h: null, m: null };
}

/** 시를 고른다. 분을 아직 안 골랐으면 00분 */
export function pickHour(d: TimeDraft, h: number): TimeDraft {
  return { h, m: d.m ?? 0 };
}

/** 분을 고른다. 시를 아직 안 골랐으면 09시 */
export function pickMinute(d: TimeDraft, m: number): TimeDraft {
  return { h: d.h ?? 9, m };
}

/**
 * 시 칸에 직접 친 글자. 숫자만 두 자리까지 받는다. 비었거나 23 을 넘으면 시는 아직 없음(확인을 막는다),
 * 그 밖은 그 시로 고른 것과 같다(분을 안 골랐으면 00분)
 */
export function typeHour(d: TimeDraft, raw: string): { draft: TimeDraft; text: string } {
  const text = raw.replace(/\D/g, "").slice(0, 2);
  if (text === "" || Number(text) > 23) return { draft: { ...d, h: null }, text };
  return { draft: pickHour(d, Number(text)), text };
}

/**
 * 시를 다 쳤는지 — 분 칸으로 넘어갈 때. 두 자리를 쳤거나, 3–9 로 시작해 더 칠 수 없을 때(「5」 = 05시).
 * 범위 밖(24 이상)이면 넘어가지 않는다 — 안내를 보며 고치게
 */
export function hourComplete(text: string): boolean {
  if (text.length === 2) return Number(text) <= 23;
  return text.length === 1 && Number(text) >= 3;
}

/** 시 칸에 친 글자가 범위(00–23)를 벗어났는지 */
export function hourOutOfRange(text: string | null): boolean {
  return text !== null && text !== "" && Number(text) > 23;
}

/**
 * 분 칸에 직접 친 글자. 숫자만 두 자리까지 받는다. 비었거나 59 를 넘으면 분은 아직 없음(확인을 막는다),
 * 그 밖은 그 분으로 고른 것과 같다
 */
export function typeMinute(d: TimeDraft, raw: string): { draft: TimeDraft; text: string } {
  const text = raw.replace(/\D/g, "").slice(0, 2);
  if (text === "" || Number(text) > 59) return { draft: { ...d, m: null }, text };
  return { draft: pickMinute(d, Number(text)), text };
}

/** 분 칸에 친 글자가 범위(00–59)를 벗어났는지 */
export function minuteOutOfRange(text: string | null): boolean {
  return text !== null && text !== "" && Number(text) > 59;
}

/**
 * 확인하면 저장할 「HH:mm」. 시를 안 골랐거나, 시 · 분 칸을 비웠거나(다시 치는 중), 범위를 벗어났으면 ""(확인 불가).
 * 분 칸을 손대지 않았으면(text null) 고른 분, 분을 안 골랐으면 00분
 */
export function draftValue(
  d: TimeDraft,
  text: string | null,
  hourText: string | null = null,
): string {
  if (d.h === null || text === "" || minuteOutOfRange(text)) return "";
  if (hourText === "" || hourOutOfRange(hourText)) return "";
  return `${pad(d.h)}:${pad(d.m ?? 0)}`;
}

/** 두 자리로(시 · 분 표시) */
export { pad as padTime };
