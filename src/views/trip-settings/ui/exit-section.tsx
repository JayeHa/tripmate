type ExitSectionProps = {
  /** 방장이면 「여행 삭제」, 멤버면 「여행 나가기」. 아직 모르면(null) 그리지 않는다 */
  isOwner: boolean | null;
  onClick: () => void;
};

const COPY = {
  owner: { label: "여행 삭제", sub: "일정·가계부·노트가 모두 지워져요." },
  member: { label: "여행 나가기", sub: "내 목록에서 이 여행이 사라져요." },
};

/**
 * 맨 아래 빨간 동작 — 모바일은 전체 폭 연빨강 버튼(위 28 띄움), PC 는 설명이 있는 카드 + 오른쪽 버튼.
 * 방장은 나갈 수 없어 같은 자리에 「여행 삭제」 를 둔다
 */
export function ExitSection({ isOwner, onClick }: ExitSectionProps) {
  if (isOwner === null) return null;
  const copy = COPY[isOwner ? "owner" : "member"];
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 min-h-11 rounded-button bg-destructive-soft text-[15px] font-semibold text-destructive lg:hidden"
      >
        {copy.label}
      </button>
      <section className="hidden items-center gap-3 rounded-card border border-line-card bg-white px-5.5 py-4.5 lg:flex">
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 className="text-[15px] font-bold text-ink-900">{copy.label}</h2>
          <p className="text-[13px] text-ink-400">{copy.sub}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="h-9.5 shrink-0 rounded-button bg-destructive-soft px-4 text-sm font-bold text-destructive"
        >
          {copy.label}
        </button>
      </section>
    </>
  );
}
