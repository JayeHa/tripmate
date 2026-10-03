"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/shared/api/supabase/client";
import { queryKeys } from "@/shared/api/query-keys";
import { writeCacheOwner } from "../lib/cache-owner";

export function useUser() {
  const queryClient = useQueryClient();

  // createClient()는 브라우저에서만 호출 (프리렌더 시 env 없이도 빌드되도록)
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") queryClient.clear();
      else if (event === "SIGNED_IN") queryClient.invalidateQueries({ queryKey: queryKeys.user });
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
    writeCacheOwner(null);
    router.replace("/login");
  };
}
