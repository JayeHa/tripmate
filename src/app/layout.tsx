import "./globals.css";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";

import { OfflineBanner } from "@/widgets/offline-banner";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "TripMate", template: "%s | TripMate" },
  description: "일정, 지도, 가계부를 일행과 함께 쓰는 여행 앱",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "TripMate" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/* 서비스 워커 — 오프라인으로 열기 · 바우처 사진(#20). 개발 중에는 끈다(저장해 둔 화면이 고친 코드를 가린다).
            연결이 돌아와도 새로고침하지 않는다(입력 중인 폼이 날아간다) */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          reloadOnOnline={false}
        >
          <OfflineBanner />
          <Providers>{children}</Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}
