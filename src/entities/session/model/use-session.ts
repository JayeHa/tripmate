"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";
import { clearOfflineCache } from "@/shared/lib/offline-cache";

export function useUser() {
  const queryClient = useQueryClient();

  // createClient()는 브라우저에서만 호출 (프리렌더 시 env 없이도 빌드되도록)
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // 세션 만료 · 다른 탭에서 로그아웃도 여기로 온다 — 기기에 남긴 화면 · 사진도 함께 지운다(공용 기기)
        queryClient.clear();
        void clearOfflineCache();
      } else if (event === "SIGNED_IN") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.user });
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
    await clearOfflineCache();
    router.replace("/login");
  };
}
