"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { APIProvider } from "@vis.gl/react-google-maps";
import { del, get, set } from "idb-keyval";
import { useState, type ReactNode } from "react";
import { shouldPersistQuery } from "@/lib/queries/keys";

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
    key: "tripmate-query-cache",
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(makePersister);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * DAY,
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
