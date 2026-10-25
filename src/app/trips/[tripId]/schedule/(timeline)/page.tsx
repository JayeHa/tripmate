import { Suspense } from "react";

import { PageTransition } from "@/shared/ui/page-transition";
import { TripScheduleView } from "@/views/trip-schedule";

export const metadata = { title: "일정" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/schedule">) {
  const { tripId } = await params;
  return (
    <PageTransition>
      <Suspense>
        <TripScheduleView tripId={tripId} />
      </Suspense>
    </PageTransition>
  );
}
