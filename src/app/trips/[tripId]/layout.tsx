import { Suspense } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TripShell } from "@/components/layout/trip-shell";

export default async function TripLayout({ children, params }: LayoutProps<"/trips/[tripId]">) {
  const { tripId } = await params;
  return (
    <div className="flex min-h-full flex-1 flex-col pb-16">
      <TripShell tripId={tripId}>{children}</TripShell>
      <Suspense>
        <BottomNav tripId={tripId} />
      </Suspense>
    </div>
  );
}
