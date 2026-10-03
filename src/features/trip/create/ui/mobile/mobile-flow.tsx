import type { TripCreateState } from "../../model/use-trip-create";
import type { TitleComponent } from "../parts/title";
import { MobileCityStep } from "./mobile-city-step";
import { MobileDateStep } from "./mobile-date-step";

/** 모바일 전체 화면 (시안 5b · 5c) */
export function MobileFlow({
  state,
  onClose,
  Title,
}: {
  state: TripCreateState;
  onClose: () => void;
  Title: TitleComponent;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {state.step === "city" ? (
        <MobileCityStep state={state} onClose={onClose} Title={Title} />
      ) : (
        <MobileDateStep state={state} Title={Title} />
      )}
    </div>
  );
}
