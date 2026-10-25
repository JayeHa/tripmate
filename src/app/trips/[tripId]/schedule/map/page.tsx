import { Suspense } from "react";

import { PageTransition } from "@/shared/ui/page-transition";
import { TripMapView } from "@/views/trip-map";

export const metadata = { title: "지도" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/schedule/map">) {
  const { tripId } = await params;
  return (
    <PageTransition>
      <Suspense>
        <TripMapView tripId={tripId} />
      </Suspense>
    </PageTransition>
  );
}
