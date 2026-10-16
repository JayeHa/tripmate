"use client";

import { useState } from "react";

import {
  removeVoucherFiles,
  titleFromFileName,
  useSaveVoucher,
  type Voucher,
  VOUCHER_GONE,
  type VoucherSave,
} from "@/entities/voucher";
import { useMountedDone, useMountedRef } from "@/shared/lib/use-mounted-done";

import {
  blankVoucherForm,
  changedFields,
  hasMoreValues,
  toVoucherFields,
  voucherFormFrom,
  type VoucherFormValues,
  type VoucherTextFields,
} from "../lib/voucher-form";
import { useVoucherFile } from "./use-voucher-file";
import { prepareVoucherFiles, removeReplaced } from "./voucher-files";

type VoucherFormOptions = {
  tripId: string;
  /** 고치는 바우처. 새로 넣으면 null */
  voucher: Voucher | null;
  /** 저장이 끝나면 창을 닫는다 — 이 창이 아직 떠 있을 때만 부른다 */
  onClose: () => void;
  /** 토스트 — 화면(view)이 그려서 이 창이 사라진 뒤에 불러도 된다 */
  onToast: (text: string) => void;
};

/**
 * 바우처 추가 · 수정 — 원본 파일 · 현장용 페이지 · 제목 · 누구 거 · 연결 · 추가 정보(사용일 · 번호 · 예약 사이트 · 메모).
 * 열 때마다 새로 마운트돼 처음 값에서 시작한다. 저장은 ① 그림 만들기 · 올리기(PDF 현장용 페이지 · 썸네일) ② 줄 저장
 * ③ 바꾼 옛 파일 지우기 순서다. 수정은 연 때와 달라진 칸만 보낸다
 */
export function useVoucherForm({ tripId, voucher, onClose, onToast }: VoucherFormOptions) {
  const [initial] = useState<VoucherFormValues>(() =>
    voucher ? voucherFormFrom(voucher) : blankVoucherForm(),
  );
  const [values, setValues] = useState(initial);
  const [moreOpen, setMoreOpen] = useState(() => hasMoreValues(initial));
  const [error, setError] = useState<string | null>(null);
  // 그림을 만들고 올리는 중 — 줄 저장(mutation) 앞 단계
  const [preparing, setPreparing] = useState(false);
  const file = useVoucherFile(tripId, voucher);
  const save = useSaveVoucher(tripId);
  const finish = useMountedDone(onClose);
  const mounted = useMountedRef();
  const pending = preparing || save.isPending;

  /** 칸 하나를 고친다 */
  function set<K extends keyof VoucherFormValues>(key: K, value: VoucherFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** 검사 → 그림 → 줄 저장 → 옛 파일 지우기 */
  async function submit() {
    const result = toVoucherFields(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setPreparing(true);
    // 고른 새 원본은 이제 저장 쪽이 맡는다 — 저장 중 창이 사라져도 지우지 않고, 실패하면 여기서 정리한다
    const pickedKey = file.picked?.key ?? null;
    file.keep();
    /** 저장 실패 — 창이 떠 있으면 원본 칸에 돌려주고, 사라졌으면 고른 원본을 지운다 */
    const dropPicked = () => {
      if (mounted.current) file.release();
      else if (pickedKey) void removeVoucherFiles(tripId, [pickedKey]);
    };
    let prepared;
    try {
      prepared = await prepareVoucherFiles({
        tripId,
        voucher,
        picked: file.picked,
        pages: result.fields.pages,
      });
    } catch {
      dropPicked();
      if (mounted.current) setError("파일을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    } finally {
      if (mounted.current) setPreparing(false);
    }
    const toSave: VoucherSave = voucher
      ? { id: voucher.id, fields: { ...patchOf(result.fields, initial), ...prepared.fields } }
      : { id: null, fields: { ...EMPTY_FILE, ...result.fields, ...prepared.fields } };
    if (toSave.id !== null && Object.keys(toSave.fields).length === 0) {
      finish();
      return;
    }
    try {
      const id = await save.mutateAsync(toSave);
      void removeReplaced(tripId, id, prepared.replaced);
      if (prepared.drawFailed) onToast("PDF 를 그림으로 만들지 못해 원본으로 보여요");
      else onToast(voucher ? "바우처를 수정했어요" : "바우처를 추가했어요");
      finish();
    } catch (e) {
      void removeVoucherFiles(tripId, prepared.created);
      dropPicked();
      if (!mounted.current) onToast(messageOf(e));
    }
  }

  return {
    values,
    set,
    file,
    /** 파일을 고른다 — 제목이 비어 있으면 파일 이름으로 채운다. 저장 중이면 무시한다(저장 중인 원본을 지우지 않게) */
    pick: (f: File) => {
      if (pending) return;
      file.pick(f);
      if (!values.title.trim()) set("title", titleFromFileName(f.name));
    },
    moreOpen,
    setMoreOpen,
    submit: () => {
      if (!pending && !file.uploading) void submit();
    },
    editing: voucher !== null,
    pending,
    canSave: values.title.trim().length > 0 && !file.uploading,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: preparing || (save.isPending && !save.isPaused),
    error: error ?? file.error ?? (save.error ? messageOf(save.error) : null),
  };
}

/** 수정 저장 칸 — 연 때 값과 달라진 것만. 연 때 값이 검사를 넘지 못하면(옛 데이터) 모든 칸 */
function patchOf(now: VoucherTextFields, initial: VoucherFormValues): Partial<VoucherTextFields> {
  const before = toVoucherFields(initial);
  return before.ok ? changedFields(now, before.fields) : now;
}

/** 새 바우처의 원본 칸 — 파일 없이 번호만 있는 바우처도 된다 */
const EMPTY_FILE = {
  file_key: null,
  file_name: null,
  file_mime: null,
  file_size: null,
  page_keys: [],
  thumb_key: null,
};

/** 요청 실패 문구 — 그사이 지워진 바우처면 그대로 알리고, 그 밖은 다시 시도 */
function messageOf(e: unknown): string {
  if (e instanceof Error && e.message === VOUCHER_GONE) return VOUCHER_GONE;
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export type VoucherFormState = ReturnType<typeof useVoucherForm>;
