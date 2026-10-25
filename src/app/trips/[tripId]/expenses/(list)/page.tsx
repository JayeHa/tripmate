import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseListView } from "@/views/expense-list";

export const metadata = { title: "가계부" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses">) {
  const { tripId } = await params;
  return (
    <PageTransition>
      <ExpenseListView tripId={tripId} />
    </PageTransition>
  );
}
