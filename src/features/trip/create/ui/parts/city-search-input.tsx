import { cn } from "@/shared/lib/utils";

type CitySearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** 도시 검색어 입력. 자리와 글자 크기만 레이아웃마다 다르다. */
export function CitySearchInput({ value, onChange, className }: CitySearchInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="여행, 어디로 떠나시나요?"
      aria-label="도시 검색"
      className={cn(
        "min-w-0 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-350",
        className,
      )}
    />
  );
}
