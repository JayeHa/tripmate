import { X } from "lucide-react";

import {
  addTag,
  hasTag,
  removeTag,
  TAG_LIMIT,
  TAG_MAX_LENGTH,
  tripTags,
  useExpenses,
} from "@/entities/expense";
import { Button } from "@/shared/ui/button";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Input } from "@/shared/ui/input";

type TagsFieldProps = {
  tripId: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  /** 쳐 두고 아직 붙이지 않은 글 — 폼이 쥐고 저장할 때 함께 붙인다 */
  draft: string;
  onDraftChange: (draft: string) => void;
  /** 이름 오른쪽 — 「📌 고정」 */
  pin: React.ReactNode;
};

/**
 * 태그(선택) — 이 여행에서 쓴 태그 칩(많이 쓴 순)을 눌러 붙이고 뗀다. 없는 태그는 쳐서 Enter · 「추가」.
 * 붙인 태그는 잉크 칩이고 ✕ 가 붙는다. 5개가 차면 붙이지 않은 칩 · 입력 칸을 막는다.
 * 태그 목록은 따로 없다 — 일행이 단 태그도 같은 칩 줄에 보인다. 쳐 두고 「추가」 를 누르지 않아도 저장하면 붙는다
 */
export function TagsField({ tripId, tags, onChange, draft, onDraftChange, pin }: TagsFieldProps) {
  const { data: expenses = [] } = useExpenses(tripId);
  const full = tags.length >= TAG_LIMIT;
  // 이 비용에만 새로 붙인 태그도 칩 줄에 — 여행의 태그 뒤에
  const known = tripTags(expenses);
  const chips = [...known, ...tags.filter((t) => !hasTag(known, t))];

  /** 입력한 태그를 붙이고 칸을 비운다 */
  const commit = () => {
    if (!draft.trim()) return;
    onChange(addTag(tags, draft, known));
    onDraftChange("");
  };
  /** 칩 하나 — 붙였으면 떼고, 아니면 붙인다 */
  const toggle = (tag: string) =>
    onChange(hasTag(tags, tag) ? removeTag(tags, tag) : addTag(tags, tag, known));

  return (
    <div role="group" aria-labelledby="expense-tags" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span id="expense-tags" className="text-sm text-ink-400">
          태그 (선택)
        </span>
        {pin}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((tag) => {
            const on = hasTag(tags, tag);
            return (
              <FilterChip
                key={tag}
                selected={on}
                disabled={!on && full}
                onClick={() => toggle(tag)}
                aria-label={on ? `${tag} 태그 떼기` : `${tag} 태그 붙이기`}
              >
                {tag}
                {on && <X className="size-3.5" aria-hidden="true" />}
              </FilterChip>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            // 한글 조합 중의 Enter 는 글자를 끝내는 것이라 붙이지 않는다 — Safari 는 조합을 끝내는 Enter 를
            // isComposing 없이 keyCode 229 로 보낸다. 폼 저장으로 넘어가지 않게 막는다
            if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
            e.preventDefault();
            commit();
          }}
          maxLength={TAG_MAX_LENGTH}
          enterKeyHint="done"
          disabled={full}
          placeholder={full ? `태그는 ${TAG_LIMIT}개까지 붙여요` : "새 태그 — 예: 런닝"}
          aria-label="새 태그"
          className="flex-1"
        />
        <Button
          type="button"
          variant="chip"
          size="form"
          onClick={commit}
          disabled={full || !draft.trim()}
        >
          추가
        </Button>
      </div>
    </div>
  );
}
