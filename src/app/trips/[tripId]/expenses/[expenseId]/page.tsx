import { ExpenseDetailView } from "@/views/expense-detail";

export const metadata = { title: "비용 상세" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses/[expenseId]">) {
  const { tripId, expenseId } = await params;
  return <ExpenseDetailView tripId={tripId} expenseId={expenseId} />;
}
