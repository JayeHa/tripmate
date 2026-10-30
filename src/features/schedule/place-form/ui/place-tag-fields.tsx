import { SUBTYPE_LABEL, subtypesFor } from "@/entities/schedule-item";
import { FilterChip } from "@/shared/ui/filter-chip";

import type { PlaceFormState } from "../model/use-place-fields";
import { Field } from "./form-parts";

type PlaceTagFieldsProps = {
  form: PlaceFormState;
  /** 장소 정보 수정이면 true — 「고르지 않으면 위치로」 안내를 뺀다(이미 정해진 지역이 있다) */
  editing: boolean;
};

/**
 * 카테고리 아래 칸 둘 — 메뉴 · 종류(그 카테고리에 목록이 있을 때, 식당은 「메뉴」) · 지역(그 도시에 목록이 있을 때).
 * 칩을 다시 누르면 비운다(「기타」). 홈 가이드의 「메뉴 ⌄」 · 「종류 ⌄」 · 「전 지역 ⌄」 필터가 이 값을 쓴다
 */
export function PlaceTagFields({ form, editing }: PlaceTagFieldsProps) {
  const { values: v, set } = form;
  const subtypes = subtypesFor(v.category);
  const isFood = v.category === "food" || v.category === "cafe";
  return (
    <>
      {subtypes.length > 0 && (
        <Field label={isFood ? "메뉴" : "종류"} optional>
          <div className="flex flex-wrap gap-2">
            {subtypes.map((s) => (
              <FilterChip
                key={s}
                selected={v.subtype === s}
                onClick={() => set("subtype", v.subtype === s ? null : s)}
              >
                {SUBTYPE_LABEL[s]}
              </FilterChip>
            ))}
          </div>
        </Field>
      )}
      {form.areas.length > 0 && (
        <Field label="지역" optional>
          <div className="flex flex-wrap gap-2">
            {form.areas.map((a) => (
              <FilterChip
                key={a.id}
                selected={v.areaId === a.id}
                onClick={() => set("areaId", v.areaId === a.id ? null : a.id)}
              >
                {a.name}
              </FilterChip>
            ))}
          </div>
          {!editing && !v.areaId && (
            <span className="text-xs text-ink-400">
              고르지 않으면 위치에서 가까운 지역으로 정해져요
            </span>
          )}
        </Field>
      )}
    </>
  );
}
