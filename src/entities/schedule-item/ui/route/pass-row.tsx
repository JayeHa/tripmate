type SlimRowProps = {
  emoji?: string | null;
  name: string;
  /** PC — 칩 뒤 「📍5」 */
  pinNo?: number | null;
  /** 누르면 원래 카드로 펼친다 */
  onClick?: () => void;
};

/** 패스한 곳의 접힌 줄 — 36 · r10 · 회색 바탕, 이모지 흑백 · 이름 14/700 · 오른쪽 「패스」 칩(PC 는 그 뒤 「📍5」) */
export function SlimRow({ emoji, name, pinNo = null, onClick }: SlimRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={false}
      className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-memo bg-pass-bg px-3 text-left"
    >
      {emoji && <span className="shrink-0 text-sm opacity-75 grayscale">{emoji}</span>}
      <span className="truncate text-sm font-bold text-pass-text">{name}</span>
      <span className="ml-auto shrink-0">
        <PassChip />
      </span>
      {pinNo !== null && (
        <span className="shrink-0 text-[11px] font-extrabold text-pass-muted">📍{pinNo}</span>
      )}
    </button>
  );
}

/** 「패스」 칩 — 진회색 바탕 · 흰 11/800 · r5 */
export function PassChip() {
  return (
    <span className="rounded-[5px] bg-pass-strong px-1.5 py-0.5 text-[11px] font-extrabold text-white">
      패스
    </span>
  );
}
