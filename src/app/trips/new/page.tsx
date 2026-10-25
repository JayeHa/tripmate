import { PageTransition } from "@/shared/ui/page-transition";
import { TripCreateView } from "@/views/trip-create";

export const metadata = { title: "새 여행" };

export default function Page() {
  return (
    <PageTransition>
      <TripCreateView />
    </PageTransition>
  );
}
