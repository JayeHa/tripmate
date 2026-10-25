import { PageTransition } from "@/shared/ui/page-transition";
import { TripHomeView } from "@/views/trip-home";

export const metadata = { title: "홈" };

export default function Page() {
  return (
    <PageTransition>
      <TripHomeView />
    </PageTransition>
  );
}
