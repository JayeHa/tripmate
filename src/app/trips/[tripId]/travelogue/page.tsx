import { Suspense } from "react";

import { PageTransition } from "@/shared/ui/page-transition";
import { TripTravelogueView } from "@/views/trip-travelogue";

export const metadata = { title: "여행기" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/travelogue">) {
  const { tripId } = await params;
  return (
    <PageTransition>
      {/* 그날 읽기는 검색값 ?day= 로 고른다 */}
      <Suspense>
        <TripTravelogueView tripId={tripId} />
      </Suspense>
    </PageTransition>
  );
}
