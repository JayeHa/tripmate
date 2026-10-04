import { MapPin } from "lucide-react";

import type { PlaceFormState } from "../model/use-place-form";

type LocationSuggestionsProps = {
  form: PlaceFormState;
  /** 하나를 고르면 부른다(목록을 닫는다) */
  onPicked: () => void;
};

/**
 * 위치 검색 결과 — 맨 위 「이 주소로 이동」(주소 검색) + 구글 장소 5곳. 검색칸 아래에 떠서 지도를 밀지 않는다
 * (부모가 relative · z-10 이고 지도는 isolate 라 지도 위로 올라온다).
 */
export function LocationSuggestions({ form, onPicked }: LocationSuggestionsProps) {
  const suggestions = form.suggestions.suggestions;
  if (!form.addressHit && suggestions.length === 0) return null;
  return (
    <ul className="absolute inset-x-5 top-full -mt-1 flex max-h-[min(20rem,50dvh)] flex-col divide-y divide-divider overflow-y-auto rounded-card border border-line bg-white shadow-[0_6px_20px_rgba(0,0,0,.12)]">
      {form.addressHit && (
        <li>
          <button
            type="button"
            onClick={() => {
              form.moveToAddress();
              onPicked();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
          >
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-bold text-primary">이 주소로 이동</span>
              <span className="truncate text-sm text-ink-900">{form.addressHit.label}</span>
            </span>
          </button>
        </li>
      )}
      {suggestions.slice(0, 5).map((s, i) => {
        const p = s.placePrediction;
        if (!p) return null;
        return (
          <li key={p.placeId || i}>
            <button
              type="button"
              onClick={() => {
                void form.pickLocation(s);
                onPicked();
              }}
              className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left"
            >
              <span className="truncate text-sm font-bold text-ink-900">{p.mainText?.text}</span>
              <span className="truncate text-xs text-ink-400">{p.secondaryText?.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
