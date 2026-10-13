import { Suspense } from "react";

import { TripNotesView } from "@/views/trip-notes";

export const metadata = { title: "노트" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/notes">) {
  const { tripId } = await params;
  // 탭을 주소(?tab=)에서 읽는다(useSearchParams) — Suspense 로 감싼다
  return (
    <Suspense>
      <TripNotesView tripId={tripId} />
    </Suspense>
  );
}
