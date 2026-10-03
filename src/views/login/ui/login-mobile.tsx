import { GoogleSignInButton } from "@/features/auth";
import { LoginIntro } from "./login-intro";
import { TermsNotice } from "./terms-notice";

/** 시안 7a. 세로 중앙에 카피, 하단에 버튼을 고정한다. */
export function LoginMobile() {
  return (
    <div className="flex flex-1 flex-col lg:hidden">
      <div className="flex flex-1 flex-col justify-center gap-3.5 px-8">
        <LoginIntro layout="mobile" />
      </div>
      <div className="flex flex-col gap-3.5 px-5 pb-[calc(44px+env(safe-area-inset-bottom))]">
        <GoogleSignInButton />
        <TermsNotice />
      </div>
    </div>
  );
}
