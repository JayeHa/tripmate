import { SettlementView } from "@/views/settlement";

export const metadata = { title: "정산" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/settlement">) {
  const { tripId } = await params;
  return <SettlementView tripId={tripId} />;
}
