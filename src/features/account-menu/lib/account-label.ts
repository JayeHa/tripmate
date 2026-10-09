import type { MyProfile } from "@/entities/session";

/** 로그인 계정 표기. 둘러보기 계정은 이메일이 없다. */
export function accountLabel(profile: MyProfile | null | undefined, style: "dot" | "paren") {
  if (!profile?.email || !profile.provider) return "둘러보기 계정";
  return style === "dot"
    ? `${profile.email} · ${profile.provider}`
    : `${profile.email} (${profile.provider})`;
}
