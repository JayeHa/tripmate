import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseListView } from "@/views/expense-list";

export const metadata = { title: "카테고리" };

export default async function Page({
  params,
  searchParams,
}: PageProps<"/trips/[tripId]/expenses/categories">) {
  const { tripId } = await params;
  const { c } = await searchParams;
  return (
    <PageTransition>
      <ExpenseListView
        tripId={tripId}
        tab="category"
        category={typeof c === "string" ? c : undefined}
      />
    </PageTransition>
  );
}
