import { DemoLoginButton } from "@/features/auth/demo-login";
import { GoogleSignInButton } from "@/features/auth/google-login";
import { Wordmark } from "@/shared/ui/wordmark";
import { LoginIntro } from "./login-intro";
import { TermsNotice } from "./terms-notice";

/** 시안 7b. 상단 64 바와 회색 배경 위 420px 카드. */
export function LoginDesktop() {
  return (
    <div className="hidden flex-1 flex-col lg:flex">
      <header className="flex h-16 shrink-0 items-center border-b border-divider px-7">
        <Wordmark className="text-[22px]" />
      </header>
      <div className="flex flex-1 items-center justify-center bg-surface-sunken">
        <div className="flex w-[420px] flex-col gap-3 rounded-sheet border border-line-card bg-white px-10 pt-11 pb-8 shadow-card">
          <LoginIntro layout="desktop" />
          <GoogleSignInButton />
          <DemoLoginButton />
          <div className="pt-1.5">
            <TermsNotice />
          </div>
        </div>
      </div>
    </div>
  );
}
