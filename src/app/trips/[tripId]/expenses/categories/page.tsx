import { ExpenseListView } from "@/views/expense-list";

export const metadata = { title: "카테고리" };

export default async function Page({
  params,
  searchParams,
}: PageProps<"/trips/[tripId]/expenses/categories">) {
  const { tripId } = await params;
  const { c } = await searchParams;
  return (
    <ExpenseListView
      tripId={tripId}
      tab="category"
      category={typeof c === "string" ? c : undefined}
    />
  );
}
