import { Suspense } from "react";
import { TripItineraryView } from "@/views/trip-itinerary";

export const metadata = { title: "일정" };

export default function Page() {
  return (
    <Suspense>
      <TripItineraryView />
    </Suspense>
  );
}
