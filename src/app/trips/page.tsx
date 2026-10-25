import { PageTransition } from "@/shared/ui/page-transition";
import { TripListView } from "@/views/trip-list";

export const metadata = { title: "내 여행" };

export default function Page() {
  return (
    <PageTransition>
      <TripListView />
    </PageTransition>
  );
}
