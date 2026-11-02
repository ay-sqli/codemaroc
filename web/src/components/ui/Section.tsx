import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./cx";
import { T } from "@/lib/i18n";
import { asset } from "@/lib/base";

/** Titre de section avec lien « Tout voir » optionnel. */
export function SectionHeader({
  title, href, linkLabel = <T fr="Tout voir" ar="عرض الكل" />, desc, className,
}: { title: ReactNode; href?: string; linkLabel?: ReactNode; desc?: ReactNode; className?: string }) {
  return (
    <div className={cx("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1", className)}>
      <div>
        <h2 className="t-h3 text-ink">{title}</h2>
        {desc && <p className="mt-1 max-w-3xl text-sm text-muted">{desc}</p>}
      </div>
      {href && (
        <Link href={href} className="link inline-flex items-center gap-1 text-sm">
          {linkLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** En-tête de page (titre + description + actions). */
export function PageHeader({
  overline, title, desc, actions, className,
}: { overline?: ReactNode; title: ReactNode; desc?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cx("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-3xl">
        {overline && <p className="t-overline mb-2">{overline}</p>}
        <h1 className="t-h1 text-ink">{title}</h1>
        {desc && <p className="mt-2 text-base text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Fil d'Ariane. */
export function Breadcrumbs({ items }: { items: { label: ReactNode; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 text-subtle" />}
          {it.href ? (
            <Link href={it.href} className="hover:text-brand hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-ink-2">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Conteneur de largeur standard. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>;
}

/** État vide. */
/** État vide : la mascotte taxi (pose au choix) remplace l'icône par défaut. */
export function EmptyState({
  icon, title, desc, action, mascot = "thinking",
}: { icon?: ReactNode; title: ReactNode; desc?: ReactNode; action?: ReactNode; mascot?: string | false }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-line-strong bg-white px-6 py-10 text-center">
      {mascot ? (
        <img src={asset(`/mascot/${mascot}.webp`)} alt="" className="h-28 w-auto" />
      ) : (
        icon && <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand">{icon}</span>
      )}
      <h3 className="t-h4">{title}</h3>
      {desc && <p className="max-w-md text-sm text-muted">{desc}</p>}
      {action}
    </div>
  );
}

/** Squelette de chargement. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[16px] bg-panel", className)} />;
}
