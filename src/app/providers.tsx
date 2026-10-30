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
import { startSavedTrips } from "@/features/trip/offline-download";
import { QUERY_CACHE_BUSTER, QUERY_PERSIST_KEY, shouldPersistQuery } from "@/shared/api/query-keys";
import { blockOfflineMutation, dropDeadEndFailures } from "@/shared/api/sync";
import { startSyncOutbox } from "@/shared/api/sync-outbox";
import { captureInstallPrompt } from "@/shared/lib/install-prompt";

import { keepStartScreen } from "./keep-start-screen";

// 「홈 화면에 앱 추가」 의 설치 이벤트는 페이지마다 한 번 일찍 와서, 앱이 뜰 때부터 받아 둔다
captureInstallPrompt();
// 오프라인에서도 첫 화면(내 여행)이 열리게 — 새 버전이 켜지면 지워지는 화면 칸에 다시 담는다
keepStartScreen();

const DAY = 24 * 60 * 60 * 1000;
/**
 * 기기에 남기는 데이터 캐시의 기간 — 「오프라인용으로 받기」 의 가장 긴 보관(받은 날부터 60일)보다 하루 길게.
 * 앱을 그동안 한 번도 열지 않아도 받아 둔 여행의 데이터가 남는다. 온라인으로 열면 곧바로 새로 읽으니 오래된 값은 잠깐만 보인다
 */
const CACHE_KEEP = 61 * DAY;

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
        gcTime: CACHE_KEEP,
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
      // 「오프라인용으로 받기」 여행도 이때 챙긴다 — 기한 지난 것 지우기 · 버려진 데이터 다시 읽기 · 새 배포로 화면 옮기기.
      // 읽기 실패로 캐시를 버렸을 때도 받은 여행의 데이터를 다시 읽는다(오프라인이면 「다시 받기」 로)
      onSuccess={() => {
        startSyncOutbox(queryClient);
        startSavedTrips(queryClient);
      }}
      onError={() => startSavedTrips(queryClient)}
      persistOptions={{
        persister,
        maxAge: CACHE_KEEP,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          // 여행 데이터 · 도시 기준 데이터 · 내 프로필만 오프라인용으로 저장(shouldPersistQuery)
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
