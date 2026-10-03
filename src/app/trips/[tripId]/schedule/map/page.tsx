import { Suspense } from "react";

import { TripMapView } from "@/views/trip-map";

export const metadata = { title: "지도" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/schedule/map">) {
  const { tripId } = await params;
  return (
    <Suspense>
      <TripMapView tripId={tripId} />
    </Suspense>
  );
}
