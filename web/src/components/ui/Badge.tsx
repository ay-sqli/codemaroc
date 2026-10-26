import type { ReactNode } from "react";
import Link from "next/link";
import { cx } from "./cx";

export type Tone = "neutral" | "brand" | "success" | "warning" | "error" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-panel text-ink-2",
  brand: "bg-brand-100 text-brand-800",
  success: "bg-ok-50 text-[#137333]",
  warning: "bg-warn-50 text-warn",
  error: "bg-ko-50 text-[#b00020]",
  dark: "bg-night text-white",
};

/** Étiquette d'information courte (statut, type, compteur). */
export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-xs font-semibold leading-5", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/** Pastille de compteur (notifications). */
export function CountDot({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cx("inline-grid min-w-5 place-items-center rounded-full bg-ko px-1.5 text-[11px] font-semibold leading-5 text-white", className)}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Puce de filtre / catégorie, contour arrondi (sélectionnable). */
export function Chip({
  selected, icon, children, onClick, href, className,
}: { selected?: boolean; icon?: ReactNode; children: ReactNode; onClick?: () => void; href?: string; className?: string }) {
  const cls = cx(
    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
    selected ? "border-brand bg-brand-50 text-brand" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand",
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
