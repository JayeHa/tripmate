import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import { isNetworkError, retrySync, SYNC_KEY, SYNC_SCOPE } from "@/shared/api/sync";

import { saveRating } from "../api/ratings";
import type { PlaceRating } from "./rating";

/** 내 별점 저장 — 오프라인 대기열(SYNC_KEY) */
export const RATING_KEY = [SYNC_KEY, "rating"] as const;

/** 별점 저장의 값 — 기기에 남아 되살아나므로 여행 id 와 누른 시각까지 담는다. stars 가 0 이면 지우기 */
export type RatingVars = {
  tripId: string;
  itemId: string;
  stars: number;
  /** 나 — 화면을 먼저 바꿀 때 내 줄을 찾는다(서버에는 보내지 않는다, DB 가 나로 채운다) */
  userId: string;
  /** 누른 시각(ISO) */
  at: string;
};

/**
 * 별점 저장의 함수 · 동작을 등록한다(앱이 시작할 때 한 번, 기기에서 되살린 저장도 쓴다).
 * 다녀감 표시(registerVisitSync)와 같다 — 화면을 먼저 바꾸고 올리며, 일정 × 나가 키라 다시 올려도 같다.
 * 서버에 닿지 못했으면 화면은 그대로 두고 「저장 실패 · 다시 시도」 로 남기고, 그 밖의 실패는 다시 읽어 되돌린다
 */
export function registerRatingSync(qc: QueryClient): void {
  qc.setMutationDefaults(RATING_KEY, {
    scope: SYNC_SCOPE,
    retry: retrySync,
    // 실패한 저장이 5분 뒤 사라지면 「저장 실패 · 다시 시도」 도 함께 사라져 변경을 잃는다 — 다시 시도할 때 지운다
    gcTime: Infinity,
    mutationFn: (v: RatingVars) => saveRating(v),
    onMutate: async (v: RatingVars) => {
      await qc.cancelQueries({ queryKey: queryKeys.ratings(v.tripId) });
      qc.setQueryData<PlaceRating[]>(queryKeys.ratings(v.tripId), (rows) => {
        if (!rows) return rows;
        const rest = rows.filter((r) => !(r.item_id === v.itemId && r.user_id === v.userId));
        if (v.stars === 0) return rest;
        return [
          ...rest,
          {
            item_id: v.itemId,
            trip_id: v.tripId,
            user_id: v.userId,
            stars: v.stars,
            rated_at: v.at,
          },
        ];
      });
    },
    onSettled: (_d, error, v: RatingVars) => {
      // 서버에 닿지 못해 실패했으면 다시 읽지 않는다 — 읽기만 되면 내 별점이 서버 값으로 풀려 보인다
      if (error && isNetworkError(error)) return;
      if (qc.isMutating({ mutationKey: RATING_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: queryKeys.ratings(v.tripId) });
      }
    },
  });
}
