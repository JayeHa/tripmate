import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

export const MEMO_TAGS = ["팁", "예약", "운영시간", "할 일", "링크"] as const;
export type MemoTag = (typeof MEMO_TAGS)[number];

const KIND: Record<MemoTag, "tip" | "book" | "hours" | "todo" | "link"> = {
  팁: "tip",
  예약: "book",
  운영시간: "hours",
  "할 일": "todo",
  링크: "link",
};

const tagVariants = cva("inline-flex w-fit items-center whitespace-nowrap", {
  variants: {
    kind: {
      tip: "text-tag-tip",
      book: "text-tag-book",
      hours: "text-tag-hours",
      todo: "text-tag-todo",
      link: "text-tag-link",
    },
    selected: {
      true: "",
      false: "border border-line bg-background text-ink-500",
    },
    selectable: {
      true: "h-8 cursor-pointer rounded-2xl border px-3 text-[13px] font-bold",
      false: "rounded-tag px-1.5 py-0.5 text-[11px] font-bold",
    },
  },
  compoundVariants: [
    { kind: "tip", selected: true, className: "border-tag-tip-bg bg-tag-tip-bg" },
    { kind: "book", selected: true, className: "border-tag-book-bg bg-tag-book-bg" },
    { kind: "hours", selected: true, className: "border-tag-hours-bg bg-tag-hours-bg" },
    { kind: "todo", selected: true, className: "border-tag-todo-bg bg-tag-todo-bg" },
    { kind: "link", selected: true, className: "border-tag-link-bg bg-tag-link-bg" },
    { selected: false, selectable: false, className: "border-0 bg-transparent" },
  ],
  defaultVariants: { selectable: false, selected: true },
});

type Props = Omit<ComponentProps<"button">, "children"> & {
  tag: MemoTag;
  selectable?: boolean;
  selected?: boolean;
};

/** 메모 태그. selectable 이면 칩 버튼, 아니면 작은 라벨. */
function Tag({ className, tag, selectable = false, selected = true, ...props }: Props) {
  const classes = cn(tagVariants({ kind: KIND[tag], selectable, selected }), className);
  if (!selectable) {
    return (
      <span data-slot="tag" className={classes}>
        {tag}
      </span>
    );
  }
  return (
    <button type="button" data-slot="tag" aria-pressed={selected} className={classes} {...props}>
      {tag}
    </button>
  );
}

export { Tag, tagVariants };
