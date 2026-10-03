import { Suspense } from "react";
import { LoginView } from "@/views/login";

export const metadata = { title: "로그인" };

export default function Page() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
