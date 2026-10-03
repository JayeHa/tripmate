import { CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { dateRangeLabel } from "@/shared/lib/days";
import { createClient } from "@/shared/api/supabase/server";
import { JoinButton } from "@/features/join-trip";

export async function TripInviteView({ token }: { token: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_trip_preview", { p_token: token });
  const preview = data?.[0];

  if (error || !preview) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-medium">초대 링크가 유효하지 않아요</p>
        <p className="text-sm text-muted-foreground">
          링크가 만료되었거나 재발급되었을 수 있어요. 일행에게 새 링크를 요청해주세요.
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/trips" />}>
          내 여행으로
        </Button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-xs">
        <p className="text-sm text-muted-foreground">여행에 초대되었어요</p>
        <h1 className="mt-1 text-2xl font-bold">{preview.title}</h1>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {preview.destination && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              {preview.destination}
            </div>
          )}
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            {dateRangeLabel(preview.start_date, preview.end_date)}
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            {preview.member_count}명 참여 중
          </div>
        </dl>
        <JoinButton token={token} />
      </div>
    </main>
  );
}
