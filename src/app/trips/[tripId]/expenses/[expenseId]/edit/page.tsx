import { ExpenseEditView } from "@/views/expense-edit";

export const metadata = { title: "비용 수정" };

export default async function Page({
  params,
}: PageProps<"/trips/[tripId]/expenses/[expenseId]/edit">) {
  const { tripId, expenseId } = await params;
  return <ExpenseEditView tripId={tripId} expenseId={expenseId} />;
}
