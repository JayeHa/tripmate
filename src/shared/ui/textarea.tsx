import { cn } from "cn";
import * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-memo border border-input bg-white px-3 py-2.5 text-[15px] text-ink-900 transition-colors outline-none placeholder:text-ink-350 focus-visible:border-primary focus-visible:shadow-[0_0_0_0.5px_var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
