import { ExpenseEditView } from "@/views/expense-edit";

export const metadata = { title: "지출 편집" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses/[expenseId]">) {
  const { tripId, expenseId } = await params;
  return <ExpenseEditView tripId={tripId} expenseId={expenseId} />;
}
