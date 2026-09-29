"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  title: ReactNode;
  back?: string | true;
  right?: ReactNode;
};

export function AppHeader({ title, back, right }: Props) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {back ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="뒤로"
          onClick={() => (back === true ? router.back() : router.push(back))}
        >
          <ChevronLeft />
        </Button>
      ) : (
        <div className="w-2" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
      {right && <div className="flex items-center gap-1">{right}</div>}
    </header>
  );
}
