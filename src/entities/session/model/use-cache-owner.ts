"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/shared/api/supabase/client";
import { readCacheOwner, writeCacheOwner } from "../lib/cache-owner";

/**
 * persist 복원에 쓸 소유자를 정한다. 앱 루트에서 한 번만 돈다.
 *
 * 돌려주는 값이 `undefined` 인 동안은 아직 모른다는 뜻이다. 그동안 복원을 미뤄야
 * 앞사람 캐시가 잠깐이라도 화면에 뜨지 않는다.
 */
export function useCacheOwner(): string | null | undefined {
  // 첫 렌더에서는 저장해 둔 주인으로 시작한다. 같은 사람이면 복원이 지연되지 않는다.
  const [owner, setOwner] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const userId = data.session?.user.id ?? null;
      writeCacheOwner(userId);
      setOwner(userId);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      writeCacheOwner(userId);
      setOwner(userId);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return owner;
}

export { readCacheOwner };
