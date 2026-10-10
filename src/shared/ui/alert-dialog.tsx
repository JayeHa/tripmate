"use client";

// Base UI 의 AlertDialog 는 바깥 누르기로 닫히지 않게 고정돼 있다(disablePointerDismissal). 시안은 바깥을 누르면 취소라
// Dialog 위에 role="alertdialog" 만 붙여 쓴다. 닫으면 안 되는 동안은 locked 로 막는다
import { Dialog as AlertDialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import * as React from "react";

import { Button } from "@/shared/ui/button";
import { TouchScrollGuard } from "@/shared/ui/touch-scroll-guard";

type AlertDialogProps = AlertDialogPrimitive.Root.Props & {
  /** 요청이 서버에 가 있는 동안 — 바깥 누르기 · Esc 로 닫히지 않는다(Dialog 의 locked 와 같다) */
  locked?: boolean;
};

/** 확인 창 — Base UI Dialog 에 locked 를 더했다 */
function AlertDialog({ locked = false, onOpenChange, ...props }: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root
      data-slot="alert-dialog"
      onOpenChange={(open, details) => {
        if (open || !locked) onOpenChange?.(open, details);
      }}
      {...props}
    />
  );
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-scrim duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  children,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal>
      {/* 확인창은 늘 맨 위라, 다른 창 안에서 열어도(중첩) 스크림을 그린다 — Base UI 는 중첩이면 기본으로 그리지 않는다 */}
      <AlertDialogOverlay forceRender />
      <AlertDialogPrimitive.Popup
        role="alertdialog"
        data-slot="alert-dialog-content"
        data-size={size}
        // 모바일은 좌우 24 를 남긴 폭, PC(1024~)는 400. 구분선 없이 흰 바탕 하나
        className={cn(
          "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-3rem)] -translate-1/2 gap-2 rounded-[16px] bg-white px-5 pt-6 pb-4 text-ink-900 duration-100 outline-none lg:w-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        <TouchScrollGuard />
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("grid place-items-start gap-2 text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        // 버튼은 가로 한 줄 — 모바일은 반씩 46, PC 는 오른쪽에 붙은 42
        "flex gap-2 pt-3 *:h-11.5 *:flex-1 *:text-[15px] *:font-bold lg:justify-end lg:*:h-10.5 lg:*:flex-none lg:*:px-4.5 lg:*:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-extrabold text-ink-900 lg:text-[19px]", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm/normal text-pretty text-ink-500", className)}
      {...props}
    />
  );
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="alert-dialog-action" className={cn(className)} {...props} />;
}

function AlertDialogCancel({
  className,
  variant = "chip",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
