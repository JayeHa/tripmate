import { airlineFromCode, searchAirlines } from "@/entities/flight";

import type { AirlineDraft } from "../model/use-airline-draft";
import { UNDERLINE_INPUT } from "./underline-input";

type AirlineStepProps = { draft: AirlineDraft };

/**
 * 「항공편명 등록」 — 항공사를 찾아 고르고(2열 목록) 편명 숫자를 넣는다. 고른 항공사를 누르면 다시 고른다.
 * 목록에 없으면 검색어가 2자리 코드일 때 그 코드로 넣는다. 「완료」 는 머리에 있다
 */
export function AirlineStep({ draft }: AirlineStepProps) {
  const results = searchAirlines(draft.query);
  const typed = airlineFromCode(draft.query);
  const offerCode = typed && !results.some((a) => a.code === typed.code);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pt-1 pb-6">
      <div className="flex flex-col gap-2 pt-3.5">
        <span className="text-[13px] text-ink-400">항공사</span>
        {draft.picked ? (
          <button
            type="button"
            onClick={draft.clear}
            className="border-b border-divider pb-3 text-left text-[17px] font-bold text-ink-900"
          >
            {draft.picked.name}({draft.picked.code})
          </button>
        ) : (
          <input
            value={draft.query}
            onChange={(e) => draft.setQuery(e.target.value)}
            placeholder="항공사명 또는 코드를 입력해주세요 예)KE"
            aria-label="항공사 검색"
            // 단계를 열면 바로 찾는다
            autoFocus
            className={UNDERLINE_INPUT}
          />
        )}
      </div>
      {!draft.picked && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {results.map((a) => (
              <button
                key={a.code}
                type="button"
                onClick={() => draft.pick(a)}
                className="flex h-13 items-center justify-center rounded-tag border border-line px-1.5 text-center text-[15px] font-semibold text-ink-600 hover:border-brand hover:text-ink-900"
              >
                {a.name}({a.code})
              </button>
            ))}
          </div>
          {results.length === 0 && (
            <span className="text-sm text-ink-400">검색 결과가 없어요.</span>
          )}
          {offerCode && (
            <button
              type="button"
              onClick={() => draft.pick(typed)}
              className="self-start text-sm font-bold text-brand-text"
            >
              코드 「{typed.code}」 로 넣기
            </button>
          )}
        </>
      )}
      {draft.picked && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-ink-400">편명</span>
          <input
            value={draft.no}
            onChange={(e) => draft.setNo(e.target.value)}
            inputMode="numeric"
            placeholder="편명을 입력해주세요. 예) KE101(X), 101(O)"
            aria-label="편명"
            // 항공사를 고르면 바로 편명을 넣는다
            autoFocus
            className={UNDERLINE_INPUT}
          />
        </div>
      )}
    </div>
  );
}
