import { LoginDesktop } from "./login-desktop";
import { LoginMobile } from "./login-mobile";

/** 1024px 을 경계로 모바일(7a)과 PC(7b) 레이아웃을 가른다. */
export function LoginView() {
  return (
    <main className="flex flex-1 flex-col">
      <LoginMobile />
      <LoginDesktop />
    </main>
  );
}
