import { Suspense } from "react";

import { PageTransition } from "@/shared/ui/page-transition";
import { HomeSkeleton, TripHomeView } from "@/views/trip-home";

export const metadata = { title: "홈" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/home">) {
  const { tripId } = await params;
  // 탭을 주소(?tab=)에서 읽는다(useSearchParams) — Suspense 로 감싼다
  return (
    <PageTransition>
      <Suspense fallback={<HomeSkeleton />}>
        <TripHomeView tripId={tripId} />
      </Suspense>
    </PageTransition>
  );
}
