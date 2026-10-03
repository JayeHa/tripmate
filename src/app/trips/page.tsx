import { TripListView } from "@/views/trip-list";

export const metadata = { title: "내 여행" };

export default async function Page({ searchParams }: PageProps<"/trips">) {
  // 방금 만든 여행. 목록에서 강조한다
  const { created } = await searchParams;
  return <TripListView createdId={typeof created === "string" ? created : null} />;
}
