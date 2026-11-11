"use client";

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchRatings } from "../api/ratings";
import { type RatingStars, starsOf } from "./rating";
import { RATING_KEY, type RatingVars } from "./rating-sync";

/** 별점의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const ratingsQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.ratings(tripId), queryFn: () => fetchRatings(tripId) });

/**
 * 그 여행에서 내가 매긴 별점과 바꾸기. 바꾸기는 오프라인 대기열로 올라가고 화면은 먼저 바뀐다.
 * 나를 모르는 동안(로그인 확인 전)은 빈 값이고 바꾸지 않는다. 0 은 지우기
 */
export function useMyRatings(tripId: string, userId: string | null) {
  const { data } = useQuery(ratingsQuery(tripId));
  const stars: RatingStars = useMemo(() => starsOf(data ?? [], userId), [data, userId]);
  const { mutate } = useMutation<void, Error, RatingVars>({ mutationKey: RATING_KEY });
  /** 일정 하나의 내 별점을 바꾼다. 0 이면 지운다 */
  function setStars(itemId: string, value: number) {
    if (!userId) return;
    mutate({ tripId, itemId, stars: value, userId, at: new Date().toISOString() });
  }
  return [stars, setStars] as const;
}
