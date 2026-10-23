"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, onlineManager, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { APIProvider } from "@vis.gl/react-google-maps";
import { del, get, set } from "idb-keyval";
import { type ReactNode, useState } from "react";

import { registerChecklistSync } from "@/entities/checklist";
import { registerExpenseSync } from "@/entities/expense";
import { registerPackSync } from "@/entities/pack";
import { registerMemoSync } from "@/entities/schedule-item";
import { QUERY_CACHE_BUSTER, QUERY_PERSIST_KEY, shouldPersistQuery } from "@/shared/api/query-keys";
import { blockOfflineMutation, dropDeadEndFailures } from "@/shared/api/sync";
import { startSyncOutbox } from "@/shared/api/sync-outbox";

const DAY = 24 * 60 * 60 * 1000;

/**
 * 쿼리 클라이언트 — 오프라인 편집 대기열(#20 ②)의 저장 함수를 등록하고, 대기열 밖 저장은 오프라인이면 막는다.
 * TanStack 은 처음에 늘 온라인으로 보고 이벤트로만 바꿔서, 오프라인으로 연 앱이 저장을 멈추지 않고 실패시킨다 — 브라우저 값으로 맞춘다
 */
function makeQueryClient() {
  if (typeof navigator !== "undefined") onlineManager.setOnline(navigator.onLine);
  const client = new QueryClient({
    mutationCache: new MutationCache({
      onMutate: (_v, mutation) => blockOfflineMutation(mutation),
    }),
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
  registerChecklistSync(client);
  registerPackSync(client);
  registerMemoSync(client);
  registerExpenseSync(client);
  dropDeadEndFailures(client);
  return client;
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

type ProvidersProps = { children: ReactNode };

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState(makePersister);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      // 오프라인 편집 대기열은 캐시와 따로 기기에 남긴다(다른 탭이 덮지 않게) — 캐시를 되살린 뒤 닫힌 탭의 대기열을 다시 올린다
      onSuccess={() => startSyncOutbox(queryClient)}
      persistOptions={{
        persister,
        maxAge: 7 * DAY,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          // 사용자/경로 캐시는 영구 저장하지 않음. 일정·가계부·여행만 오프라인용으로 저장.
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" && shouldPersistQuery(q.queryKey),
          // 저장(뮤테이션)은 캐시와 함께 남기지 않는다 — 함수 없이 되살아나 실행되지 못하고(#195), 대기열은 sync-outbox 가 따로 남긴다
          shouldDehydrateMutation: () => false,
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
