/** 모바일 하단 고정 영역. 홈 인디케이터만큼 띄운다. */
export function MobileFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-divider bg-white px-5 pt-3 pb-[calc(34px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
