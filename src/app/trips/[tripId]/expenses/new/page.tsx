import { ExpenseCreateView } from "@/views/expense-create";

export const metadata = { title: "비용 추가" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses/new">) {
  const { tripId } = await params;
  return <ExpenseCreateView tripId={tripId} />;
}
