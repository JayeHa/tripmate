import { Suspense } from "react";

import { TripScheduleView } from "@/views/trip-schedule";

export const metadata = { title: "일정" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/schedule">) {
  const { tripId } = await params;
  return (
    <Suspense>
      <TripScheduleView tripId={tripId} />
    </Suspense>
  );
}
