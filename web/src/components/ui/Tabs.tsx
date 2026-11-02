"use client";

import type { ReactNode } from "react";
import { cx } from "./cx";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
}

/** Onglets soulignés (navigation de page). */
export function Tabs<T extends string>({
  items, value, onChange, className,
}: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("no-scrollbar flex gap-6 overflow-x-auto border-b-2 border-line", className)}>
      {items.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              "-mb-[2px] inline-flex shrink-0 items-center gap-2 border-b-[3px] pb-3 pt-2 text-[14px] font-[800] uppercase tracking-wide transition-colors rtl:tracking-normal",
              active ? "border-brand text-brand" : "border-transparent text-muted hover:text-brand",
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span className={cx("rounded-[12px] px-1.5 text-xs leading-5", active ? "bg-brand-100 text-brand-800" : "bg-panel text-muted")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Onglets en pilules (sur bandeau coloré ou fond clair). */
export function PillTabs<T extends string>({
  items, value, onChange, onDark = false, className,
}: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; onDark?: boolean; className?: string }) {
  return (
    <div role="tablist" className={cx("no-scrollbar flex gap-2 overflow-x-auto", className)}>
      {items.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-sm font-[800] transition-colors",
              onDark
                ? active
                  ? "bg-white text-ink"
                  : "bg-white/15 text-white hover:bg-white/25"
                : active
                  ? "border-2 border-brand-200 bg-brand-100 text-brand"
                  : "border-2 border-line bg-white text-muted shadow-[0_2px_0_var(--c-grey-200)] hover:bg-panel",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Contrôle segmenté (choix exclusif dans un formulaire). */
export function Segmented<T extends string>({
  options, value, onChange, className,
}: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="radiogroup" className={cx("inline-flex w-full flex-wrap rounded-[12px] border-2 border-line bg-white p-0.5", className)}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cx(
              "min-h-9 flex-1 rounded-[8px] px-3 text-sm font-[800] transition-colors",
              active ? "bg-brand-100 text-brand" : "text-muted hover:bg-panel",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
