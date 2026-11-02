import type { ReactNode } from "react";
import Link from "next/link";
import { cx } from "./cx";

export type Tone = "neutral" | "brand" | "success" | "warning" | "error" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-panel text-muted",
  brand: "bg-brand-100 text-brand-2",
  success: "bg-ok-50 text-ok-700",
  warning: "bg-warn-50 text-warn",
  error: "bg-ko-50 text-ko-700",
  dark: "bg-night text-white",
};

/** Étiquette d'information courte (statut, type, compteur). */
export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-[10px] px-2.5 py-0.5 text-xs font-[800] uppercase tracking-wide leading-5 rtl:tracking-normal", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Pastille de compteur (notifications). */
export function CountDot({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cx("inline-grid min-w-5 place-items-center rounded-full bg-ko px-1.5 text-[11px] font-[800] leading-5 text-white", className)}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Puce de filtre / catégorie, contour arrondi (sélectionnable). */
export function Chip({
  selected, icon, children, onClick, href, className,
}: { selected?: boolean; icon?: ReactNode; children: ReactNode; onClick?: () => void; href?: string; className?: string }) {
  const cls = cx(
    "inline-flex items-center gap-2 rounded-[12px] border-2 px-3.5 py-1.5 text-sm font-[800] transition-colors",
    selected ? "border-brand-200 bg-brand-100 text-brand" : "border-line bg-white text-muted shadow-[0_2px_0_var(--c-grey-200)] hover:bg-panel",
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cls}>
      {icon}
      {children}
    </button>
  );
}
