import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseListView } from "@/views/expense-list";

export const metadata = { title: "지출 · 정산" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses/stats">) {
  const { tripId } = await params;
  return (
    <PageTransition>
      <ExpenseListView tripId={tripId} tab="stats" />
    </PageTransition>
  );
}
