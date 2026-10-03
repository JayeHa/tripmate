import type { TripCreateState } from "../../model/use-trip-create";

type CreateErrorProps = { state: TripCreateState };

/** 만들기 요청이 실패했을 때의 안내 */
export function CreateError({ state }: CreateErrorProps) {
  if (!state.create.error) return null;
  return (
    <p className="text-sm text-destructive">여행을 만들지 못했어요: {state.create.error.message}</p>
  );
}
