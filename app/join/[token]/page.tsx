import { TripInviteView } from "@/views/trip-invite";

export const metadata = { title: "여행 초대" };

export default async function Page({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  return <TripInviteView token={token} />;
}
