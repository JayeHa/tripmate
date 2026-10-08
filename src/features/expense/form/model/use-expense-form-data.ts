import { useExpenses, useTripGuests, useTripReceipts } from "@/entities/expense";
import { useAlternatives, useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";

/**
 * 비용 화면(추가 · 수정)이 폼을 열기 전에 읽는 것 — 여행 · 멤버 · 정산 인원 · 일정 · 대체 장소 · 영수증 · 나.
 * 영수증은 폼이 처음 값으로 한 번만 받으므로(붙어 있던 것을 지우면 뗀다) 기다린다.
 * 모두 오기 전에는 `data` 가 null 이다. 폼은 처음 값(사람 목록 · 처음 연결이 대체 장소인지)을 이 값으로 정하기 때문이다.
 * 비용 목록은 「일정마다 이미 쓴 돈」 에만 써서 기다리지 않는다.
 * 기기에 저장된 값이 있으면 다시 읽기가 실패해도 그 값으로 연다 — 값이 없는 채 실패했을 때만 `failed`
 */
export function useExpenseFormData(tripId: string) {
  const trip = useTrip(tripId);
  const members = useTripMembers(tripId);
  const guests = useTripGuests(tripId);
  const items = useScheduleItems(tripId);
  const alternatives = useAlternatives(tripId);
  const receipts = useTripReceipts(tripId);
  const { data: expenses } = useExpenses(tripId);
  const { data: user } = useUser();
  const loads = [trip, members, guests, items, alternatives, receipts];

  const [t, m, g, i, a] = [trip.data, members.data, guests.data, items.data, alternatives.data];
  const r = receipts.data;
  const data =
    t && m && g && i && a && r && user
      ? {
          trip: t,
          members: m,
          guests: g,
          items: i,
          alternatives: a,
          expenses,
          /** 여행의 영수증 줄 — 수정할 때 그 지출의 것만 골라 폼에 넘긴다 */
          tripReceipts: r,
          currentUserId: user.id,
        }
      : null;
  return {
    data,
    failed: loads.some((q) => q.isError && q.data === undefined),
    retry: () => loads.forEach((q) => void q.refetch()),
  };
}
