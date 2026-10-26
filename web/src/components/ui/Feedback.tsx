"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, X, XCircle } from "lucide-react";
import { cx } from "./cx";
import { IconButton } from "./Button";
import { useLang } from "@/lib/i18n";

export type CalloutTone = "info" | "success" | "warning" | "error" | "tip";

const calloutTone: Record<CalloutTone, { box: string; icon: ReactNode }> = {
  info: { box: "border-brand-200 bg-brand-50", icon: <Info className="size-5 text-brand" /> },
  tip: { box: "border-[#f3d38a] bg-warn-50", icon: <Info className="size-5 text-warn" /> },
  success: { box: "border-[#b7dfc6] bg-ok-50", icon: <CheckCircle2 className="size-5 text-ok" /> },
  warning: { box: "border-[#f3d38a] bg-warn-50", icon: <AlertTriangle className="size-5 text-warn" /> },
  error: { box: "border-[#f2c2c2] bg-ko-50", icon: <XCircle className="size-5 text-ko" /> },
};

/** Message contextuel (information, réussite, avertissement, erreur). */
export function Callout({
  tone = "info", title, children, icon, className,
}: { tone?: CalloutTone; title?: ReactNode; children?: ReactNode; icon?: ReactNode; className?: string }) {
  const t = calloutTone[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cx("flex gap-3 rounded-[8px] border p-4", t.box, className)}>
      <span className="mt-0.5 shrink-0">{icon ?? t.icon}</span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink-2">
        {title && <p className="mb-0.5 font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** Barre de progression fine. */
export function ProgressBar({
  value, max = 100, tone = "brand", size = "md", label,
}: { value: number; max?: number; tone?: "brand" | "ok" | "ko" | "warn"; size?: "sm" | "md"; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const c = { brand: "bg-brand", ok: "bg-ok", ko: "bg-ko", warn: "bg-warn-500" }[tone];
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cx("w-full overflow-hidden rounded-full bg-[#e1e6ee]", size === "sm" ? "h-1" : "h-1.5")}
    >
      <div className={cx("h-full rounded-full transition-[width] duration-500", c)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Anneau de progression (score). */
export function ProgressRing({ pct, size = 120, tone = "brand", children }: { pct: number; size?: number; tone?: "brand" | "ok" | "ko"; children?: ReactNode }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = { brand: "var(--brand)", ok: "var(--ok)", ko: "var(--ko)" }[tone];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
        <circle cx={60} cy={60} r={r} fill="none" stroke="#e1e6ee" strokeWidth={8} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(Math.max(0, Math.min(100, pct)) / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

/** Accordéon (FAQ, listes dépliables). */
export function Accordion({ items }: { items: { q: ReactNode; a: ReactNode }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <AccordionItem key={i} q={it.q} a={it.a} />
      ))}
    </div>
  );
}

export function AccordionItem({ q, a, defaultOpen = false }: { q: ReactNode; a: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 py-4 text-start text-[15px] font-semibold text-ink hover:text-brand"
      >
        <ChevronDown className={cx("size-5 shrink-0 text-ink-2 transition-transform", open && "rotate-180")} />
        <span className="flex-1">{q}</span>
      </button>
      {open && (
        <div id={id} className="pb-5 ps-8 text-[15px] leading-relaxed text-ink-2">
          {a}
        </div>
      )}
    </div>
  );
}

/** Fenêtre modale (dialogue). */
export function Modal({
  open, onClose, title, overline, desc, children, size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  overline?: ReactNode;
  desc?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useLang();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" }[size];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1f1f1f]/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cx("animate-pop max-h-[92dvh] w-full overflow-y-auto rounded-t-[8px] bg-white p-6 shadow-lg sm:rounded-[8px]", w)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {overline && <p className="t-overline mb-1">{overline}</p>}
            <h2 className="t-h3">{title}</h2>
            {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
          </div>
          <IconButton label={t("Fermer", "إغلاق")} onClick={onClose} className="-me-2 -mt-1">
            <X className="size-5" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
