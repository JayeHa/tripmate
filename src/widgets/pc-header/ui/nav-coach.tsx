type NavCoachProps = { onDismiss: () => void };

/**
 * PC 상단 메뉴 첫 방문 안내. 메뉴를 파란 3px 테두리로 밝히고 나머지 화면은 어둡게 덮은 뒤, 아래에 검정 말풍선을 띄운다.
 * 메뉴(`nav`) 안에 절대 위치로 그려 메뉴 폭을 따로 재지 않는다 — 부모 `nav` 는 relative, 헤더는 그동안 다른 것보다 위(z 60)여야 한다.
 * 어두운 막은 그림자라 누름을 받지 않는다. 그래서 화면 전체를 덮는 투명한 닫기 칸을 따로 깔아,
 * 어디를 눌러도(밝힌 칸 포함) 안내만 닫히고 뒤의 버튼 · 탭은 눌리지 않게 한다.
 * 뒤의 버튼으로 창(z 50)이 열리면 z 60 헤더의 막 아래에 깔리기 때문이다
 */
export function NavCoach({ onDismiss }: NavCoachProps) {
  return (
    <>
      <button
        type="button"
        aria-label="메뉴 안내 닫기"
        onClick={onDismiss}
        className="fixed inset-0 z-10 cursor-default"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-2.5 top-3 z-10 h-10 rounded-card shadow-[0_0_0_3px_var(--color-brand),0_0_0_9999px_rgb(17_17_17/0.35)]"
      />
      <div className="absolute top-[calc(100%+6px)] -left-1 z-10 flex w-max flex-col items-start">
        <span aria-hidden className="-mb-1.75 ml-10 size-3.5 rotate-45 rounded-xs bg-ink-900" />
        <div className="flex items-center gap-3.5 rounded-card bg-ink-900 px-4 py-3.5 text-white shadow-[0_10px_28px_rgb(0_0_0/0.22)]">
          <div className="flex flex-col gap-0.75">
            <span className="text-[15px] font-extrabold">여기서 이 여행의 메뉴를 옮겨 다녀요</span>
            <span className="text-[13px] text-on-dark-muted">일정 · 가계부 · 노트 · 설정</span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="h-8 rounded-button bg-brand px-3 text-[13px] font-bold text-on-brand"
          >
            알겠어요
          </button>
        </div>
      </div>
    </>
  );
}
