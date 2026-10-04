"use client";

import { useEffect, useState } from "react";

/** 값이 delay(ms) 동안 바뀌지 않으면 그 값을 돌려준다. 그 전까지는 마지막으로 자리 잡은 값 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
