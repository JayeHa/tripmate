"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { fetchCityCatalog } from "../api/cities";

const DAY = 24 * 60 * 60 * 1000;

/** 도시 기준 데이터. 마이그레이션으로만 바뀌므로 하루 동안 다시 받지 않는다. */
export function useCityCatalog() {
  return useQuery({ queryKey: queryKeys.cities, queryFn: fetchCityCatalog, staleTime: DAY });
}
