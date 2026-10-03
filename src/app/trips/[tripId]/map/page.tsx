import { Suspense } from "react";
import { TripMapView } from "@/views/trip-map";

export const metadata = { title: "지도" };

export default function Page() {
  return (
    <Suspense>
      <TripMapView />
    </Suspense>
  );
}
