"use client";

import type { ComponentProps, ReactNode } from "react";
import { Check, Search } from "lucide-react";
import { cx } from "./cx";
import { useLang } from "@/lib/i18n";

/** Champ texte. */
export function Input({ className, ...rest }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "min-h-11 w-full rounded-[12px] border-2 border-line-strong bg-white px-3 text-[15px] text-ink placeholder:text-subtle",
        "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
        className,
      )}
      {...rest}
    />
  );
}

/** Champ avec libellé. */
export function Field({ label, hint, children, required }: { label: ReactNode; hint?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-ko"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Barre de recherche arrondie avec bouton loupe. */
export function SearchField({
  className, onSubmit, ...rest
}: ComponentProps<"input"> & { onSubmit?: () => void }) {
  const { t } = useLang();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cx("flex h-11 items-center rounded-full border-2 border-line-strong bg-white ps-4 pe-1 focus-within:border-brand", className)}
    >
      <input className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" {...rest} />
      <button type="submit" aria-label={t("Rechercher", "بحث")} className="grid size-9 place-items-center rounded-full bg-brand text-white hover:bg-brand-2">
        <Search className="size-4" />
      </button>
    </form>
  );
}

/** Case à cocher. */
export function Checkbox({ checked, onChange, label, count }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[15px] text-ink-2">
      <span
        className={cx(
          "grid size-5 shrink-0 place-items-center rounded-[8px] border-2 transition-colors",
          checked ? "border-brand bg-brand text-white" : "border-line-strong bg-white",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-sm text-muted">({count})</span>}
    </label>
  );
}

/** Interrupteur. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-[15px] text-ink-2">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-ok" : "bg-line-strong")}
      >
        <span className={cx("absolute top-0.5 size-6 rounded-full bg-white shadow transition-[inset-inline-start]", checked ? "start-[22px]" : "start-0.5")} />
      </button>
    </label>
  );
}

/** Option de réponse de quiz (radio ou case à cocher), avec état de correction. */
export function ChoiceOption({
  index, multi, selected, state, onClick, children, disabled,
}: {
  index: number;
  multi: boolean;
  selected: boolean;
  state?: "correct" | "wrong" | "missed";
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  // Tuile en relief : bordure 2 px + ombre pleine de la couleur de la bordure.
  const border =
    state === "correct"
      ? "border-[#2ecc71] bg-ok-50 text-ok shadow-[0_4px_0_#25a25a]"
      : state === "wrong"
        ? "border-ko bg-ko-50 text-ko-700 shadow-[0_4px_0_var(--c-red-700)]"
        : state === "missed"
          ? "border-[#2ecc71] border-dashed shadow-[0_4px_0_#2ecc71]"
          : selected
            ? "border-info bg-[#ebf5fb] shadow-[0_4px_0_#1f618d]"
            : "border-line bg-white shadow-[0_4px_0_var(--c-grey-300)] hover:bg-panel";
  const { t } = useLang();
  const mark = state === "correct" || (selected && !state) ? "border-info bg-info" : state === "wrong" ? "border-ko bg-ko" : "border-line-strong bg-white";
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cx("flex w-full items-start gap-3 rounded-[16px] border-2 px-4 py-3.5 text-start transition-[transform,box-shadow] active:translate-y-[2px] disabled:cursor-default disabled:active:translate-y-0", border)}
    >
      <span
        className={cx(
          "mt-0.5 grid size-5 shrink-0 place-items-center border-2 text-white",
          multi ? "rounded-[8px]" : "rounded-full",
          state === "correct" ? "border-ok bg-ok" : mark,
        )}
      >
        {(selected || state === "correct") && (multi ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-2 rounded-full bg-white" />)}
      </span>
      <span className="sr-only">{t(`Option ${index + 1}`, `الخيار ${index + 1}`)}</span>
      <span className="min-w-0 flex-1 text-[16px] font-[700] leading-relaxed text-ink">{children}</span>
    </button>
  );
}
