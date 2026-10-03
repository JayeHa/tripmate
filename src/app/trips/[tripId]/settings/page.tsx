import { TripSettingsView } from "@/views/trip-settings";

export const metadata = { title: "여행 설정" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/settings">) {
  const { tripId } = await params;
  return <TripSettingsView tripId={tripId} />;
}
