import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // 입력칸 44 · r10 · 1px #E3E5E8, 포커스는 1.5px 블루(테두리 + 0.5px 그림자 — 두께가 바뀌어 글자가 밀리지 않게)
        "h-11 w-full min-w-0 rounded-memo border border-input bg-white px-3 text-[15px] text-ink-900 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-350 focus-visible:border-primary focus-visible:shadow-[0_0_0_0.5px_var(--color-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
