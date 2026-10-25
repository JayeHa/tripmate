import { SettingsSkeleton } from "@/views/trip-settings";

/** 여행 설정을 서버에서 받는 동안 — 0.3초 넘게 걸리면 뼈대를 보인다 */
export default function Loading() {
  return <SettingsSkeleton />;
}
