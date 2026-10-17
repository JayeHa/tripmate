import type { ReactNode } from "react";

import type { ScheduleItem } from "@/entities/schedule-item";

/**
 * 바우처 칸 · 「추가」 줄의 바우처 칩 — 뷰어 · 바로 올리기는 바우처 기능이라 화면(view)이 그려 넣는다(기능끼리는 서로 가져오지 않는다)
 */
export type DetailVoucherSlot = {
  /** 이 일정의 바우처 칸 — 바우처가 없으면 아무것도 그리지 않는다 */
  renderBlock: (item: ScheduleItem) => ReactNode;
  /** 「추가」 줄의 바우처 칩 — 바우처가 없을 때만 부른다 */
  renderChip: (item: ScheduleItem) => ReactNode;
};
