import "./globals.css";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";

import { ConnectionStatus } from "@/widgets/connection-status";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "TripMate", template: "%s | TripMate" },
  description: "일정, 지도, 가계부를 일행과 함께 쓰는 여행 앱",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "TripMate" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

/**
 * maximumScale 1 — iOS 는 글자가 16px 보다 작은 입력칸을 누르면 화면을 확대하고, 키보드를 닫아도 확대가 남는다.
 * 입력칸 글자는 시안대로 13~15px 이라 이 한 줄로 자동 확대를 끈다. iOS 의 손가락 확대는 그대로지만
 * 안드로이드는 손가락 확대도 막힌다(2026-10-30 사용자 결정, 글자 크기 유지 쪽)
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* 서비스 워커 — 오프라인으로 열기 · 바우처 사진(#20). 개발 중에는 끈다(저장해 둔 화면이 고친 코드를 가린다).
            연결이 돌아와도 새로고침하지 않는다(입력 중인 폼이 날아간다). module 서비스 워커를 모르는 브라우저가 있어 classic 으로 등록한다 */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          reloadOnOnline={false}
          options={{ type: "classic" }}
        >
          <Providers>
            <ConnectionStatus />
            {children}
          </Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}
