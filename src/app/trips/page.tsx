import { TripListView } from "@/views/trip-list";

export const metadata = { title: "내 여행" };

export default async function Page({ searchParams }: PageProps<"/trips">) {
  // 방금 만들거나 기간을 고친 여행. 목록에서 강조한다
  const { highlight } = await searchParams;
  return <TripListView highlightId={typeof highlight === "string" ? highlight : null} />;
}
