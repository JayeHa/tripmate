"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { del } from "idb-keyval";
import { createClient } from "@/shared/api/supabase/client";
import { CACHE_OWNER_KEY, QUERY_PERSIST_KEY, queryKeys } from "@/shared/api/query-keys";
import { decideCacheOwner } from "../lib/cache-owner";

export function useUser() {
  const queryClient = useQueryClient();

  // createClient()는 브라우저에서만 호출 (프리렌더 시 env 없이도 빌드되도록)
  useEffect(() => {
    const supabase = createClient();

    /**
     * 캐시를 비운다. 쿼리 키에 user id 가 없고 여행 캐시가 IndexedDB 에 7일 남으므로,
     * 사람이 바뀌면 앞사람 데이터가 새 계정 목록에 되살아난다.
     * 메모리 캐시만 비우면 바로 다음 페이지 이동에서 저장본이 다시 올라오므로
     * 저장소도 함께 지운다.
     */
    async function dropEveryoneElsesCache() {
      queryClient.clear();
      await del(QUERY_PERSIST_KEY);
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(CACHE_OWNER_KEY);
        void dropEveryoneElsesCache();
        return;
      }
      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;

      const userId = session?.user.id;
      if (!userId) return;

      // 누구 캐시인지 저장소에 적어 둔다. OAuth 는 전체 페이지 이동이라
      // 메모리 변수로 비교하면 매번 초기화돼 사람이 바뀐 걸 놓친다.
      const cacheOwner = localStorage.getItem(CACHE_OWNER_KEY);
      localStorage.setItem(CACHE_OWNER_KEY, userId);

      if (decideCacheOwner(cacheOwner, userId) === "drop") {
        void dropEveryoneElsesCache();
        return;
      }
      if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: queryKeys.user });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      const { data, error } = await createClient().auth.getUser();
      if (error) throw error;
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    queryClient.clear();
    await del(QUERY_PERSIST_KEY);
    localStorage.removeItem(CACHE_OWNER_KEY);
    router.replace("/login");
  };
}
