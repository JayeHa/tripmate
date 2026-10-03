"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { APIProvider } from "@vis.gl/react-google-maps";
import { del, get, set } from "idb-keyval";
import { useState, type ReactNode } from "react";
import { cacheBuster, useCacheOwner } from "@/entities/session";
import { QUERY_PERSIST_KEY, shouldPersistQuery } from "@/shared/api/query-keys";

const DAY = 24 * 60 * 60 * 1000;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 7 * DAY,
        // 오프라인이어도 캐시된 데이터를 보여주고, 온라인 복귀 시 refetch
        networkMode: "offlineFirst",
        retry: 1,
      },
      mutations: {
        networkMode: "online",
      },
    },
  });
}

function makePersister() {
  return createAsyncStoragePersister({
    storage: {
      getItem: (key) => get(key),
      setItem: (key, value) => set(key, value),
      removeItem: (key) => del(key),
    },
    key: QUERY_PERSIST_KEY,
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(makePersister);
  // 캐시 주인을 앱 루트에서 한 번만 정한다. 화면마다 판정하면 로그인 후 도착하는
  // /trips · /join 처럼 그 훅이 없는 곳을 놓친다.
  const owner = useCacheOwner();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * DAY,
        // 주인이 다르면 저장본을 복원하지 않고 버린다. 복원한 뒤에 지우는 방식은
        // 자식 effect 가 먼저 돌아 폐기가 복원을 앞지르는 경쟁이 있었다.
        buster: cacheBuster(owner),
        dehydrateOptions: {
          // 사용자/경로 캐시는 영구 저장하지 않음. 일정·가계부·여행만 오프라인용으로 저장.
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" && shouldPersistQuery(q.queryKey),
        },
      }}
    >
      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ?? ""}
        libraries={["places", "marker"]}
        language="ko"
        region="KR"
      >
        {children}
      </APIProvider>
    </PersistQueryClientProvider>
  );
}
