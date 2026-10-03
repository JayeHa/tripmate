import { Suspense } from "react";
import { TripItineraryView } from "@/views/trip-itinerary";

export const metadata = { title: "일정" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/itinerary">) {
  const { tripId } = await params;
  return (
    <Suspense>
      <TripItineraryView tripId={tripId} />
    </Suspense>
  );
}
