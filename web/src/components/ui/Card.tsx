import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./cx";

/** Conteneur blanc bordé, rayon 8 px. `interactive` = survol avec ombre. */
export function Card({
  children, className, interactive, padded = true,
}: { children: ReactNode; className?: string; interactive?: boolean; padded?: boolean }) {
  return (
    <div
      className={cx(
        "rounded-[16px] border-2 border-line bg-white",
        padded && "p-5",
        interactive && "transition-colors hover:bg-panel",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Panneau bleu-gris contenant une liste de cartes (ex. « Les plus populaires → »). */
export function Panel({
  title, href, children, className, action,
}: { title: ReactNode; href?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cx("rounded-[16px] border-2 border-line bg-white p-3", className)}>
      <header className="flex items-center justify-between px-2 pb-3 pt-1">
        {href ? (
          <Link href={href} className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:text-brand">
            {title}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <h3 className="text-[15px] font-semibold">{title}</h3>
        )}
        {action}
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Ligne de catalogue compacte : vignette + éditeur + titre + méta. */
export function ListItem({
  href, thumb, eyebrow, title, meta, trailing,
}: { href: string; thumb: ReactNode; eyebrow?: ReactNode; title: ReactNode; meta?: ReactNode; trailing?: ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-[16px] border-2 border-line bg-white p-2 transition-colors hover:bg-panel">
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-panel">{thumb}</span>
      <span className="min-w-0 flex-1">
        {eyebrow && <span className="block truncate text-xs text-muted">{eyebrow}</span>}
        <span className="block truncate text-[15px] font-[800] text-ink">{title}</span>
        {meta && <span className="block truncate text-xs text-muted">{meta}</span>}
      </span>
      {trailing}
    </Link>
  );
}

/** Carte produit verticale : visuel 16:9, éditeur, titre, méta. */
export function ProductCard({
  href, media, eyebrow, title, subtitle, meta, footer, className,
}: {
  href: string;
  media: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx("group flex flex-col overflow-hidden rounded-[16px] border-2 border-line bg-white shadow-[0_4px_0_var(--c-grey-200)] transition-transform hover:-translate-y-0.5", className)}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-panel">{media}</div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {eyebrow && <div className="flex items-center gap-2 text-xs text-muted">{eyebrow}</div>}
        <h3 className="line-clamp-2 text-base font-[800] leading-snug text-ink">{title}</h3>
        {subtitle && <div className="line-clamp-1 text-sm text-muted">{subtitle}</div>}
        {meta && <div className="mt-auto pt-2 text-xs text-muted">{meta}</div>}
        {footer}
      </div>
    </Link>
  );
}

/** Grande carte d'action horizontale (« Lancer une nouvelle carrière »). */
export function ActionCard({ href, title, icon, desc }: { href: string; title: ReactNode; icon: ReactNode; desc?: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-[16px] border-2 border-line bg-white px-5 py-6 shadow-[0_4px_0_var(--c-grey-200)] transition-colors hover:bg-panel"
    >
      <span>
        <span className="block text-base font-[800] text-ink">{title}</span>
        {desc && <span className="mt-0.5 block text-sm text-muted">{desc}</span>}
      </span>
      <span className="text-brand">{icon}</span>
    </Link>
  );
}

/** Tuile de chiffre clé. */
export function Stat({ label, value, hint, tone = "ink" }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: "ink" | "brand" | "ok" | "ko" }) {
  const c = { ink: "text-ink", brand: "text-brand", ok: "text-ok", ko: "text-ko" }[tone];
  return (
    <div className="rounded-[16px] border-2 border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={cx("mt-1 text-2xl font-[800] leading-tight", c)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
