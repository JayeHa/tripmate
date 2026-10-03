"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";
import type { Tables } from "@/shared/api/supabase/database.types";

export type MyProfile = Tables<"profiles"> & {
  email: string | null;
  /** 로그인 수단. 둘러보기(익명)면 null. */
  provider: "Google" | null;
};

/** 로그인한 사람 자신의 프로필. 이메일과 로그인 수단은 auth 쪽에만 있어 함께 붙인다. */
export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async (): Promise<MyProfile | null> => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      if (error) throw error;
      return {
        ...data,
        email: auth.user.email ?? null,
        provider: auth.user.is_anonymous ? null : "Google",
      };
    },
  });
}

export function useUpdateDisplayName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("로그인이 필요해요");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.myProfile });
      // 멤버 목록에도 이름이 나온다
      void qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
