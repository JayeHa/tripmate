type MobileLayoutProps = { header: React.ReactNode; content: React.ReactNode };

/** 모바일: 위 손잡이 · 머리 · 스크롤 본문 */
export function MobileLayout({ header, content }: MobileLayoutProps) {
  return (
    <>
      <div className="flex shrink-0 justify-center bg-surface-sunken pt-2">
        <span aria-hidden="true" className="h-1 w-10 rounded-full bg-line" />
      </div>
      {header}
      {content}
    </>
  );
}

/** PC: 머리 · 스크롤 본문 · 아래 안내 */
export function PcLayout({ header, content }: MobileLayoutProps) {
  return (
    <>
      {header}
      {content}
      <div className="flex shrink-0 items-center border-t border-surface-muted px-6 py-3.5">
        <span className="text-[13px] text-ink-400">「수정」을 누르면 바로 고칠 수 있어요</span>
      </div>
    </>
  );
}
