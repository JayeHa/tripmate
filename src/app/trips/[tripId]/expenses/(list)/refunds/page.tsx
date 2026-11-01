import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseListView } from "@/views/expense-list";

export const metadata = { title: "환급" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses/refunds">) {
  const { tripId } = await params;
  return (
    <PageTransition>
      <ExpenseListView tripId={tripId} tab="refund" />
    </PageTransition>
  );
}
