import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseListView } from "@/views/expense-list";

export const metadata = { title: "정산" };

export default async function Page({
  params,
  searchParams,
}: PageProps<"/trips/[tripId]/expenses/settlement">) {
  const { tripId } = await params;
  const { p } = await searchParams;
  return (
    <PageTransition>
      <ExpenseListView
        tripId={tripId}
        tab="settle"
        person={typeof p === "string" ? p : undefined}
      />
    </PageTransition>
  );
}
