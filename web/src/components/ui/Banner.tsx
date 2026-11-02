import type { ReactNode } from "react";
import { cx } from "./cx";

/** Bandeau sombre (mise en avant principale). */
export function HeroBanner({
  title, desc, actions, visual, className,
}: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; visual?: ReactNode; className?: string }) {
  return (
    <section className={cx("relative flex overflow-hidden sm:min-h-[260px] rounded-[24px] bg-ok text-white shadow-[0_6px_0_var(--c-green-500)]", className)}>
      <div className="relative z-10 flex flex-col sm:max-w-[55%] justify-center gap-3 p-6 sm:p-8">
        <h2 className="text-2xl font-[800] leading-tight sm:text-[30px]">{title}</h2>
        {desc && <p className="text-[16px] leading-relaxed text-white/90">{desc}</p>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {visual && <div className="absolute inset-y-0 end-0 hidden w-1/2 sm:block">{visual}</div>}
    </section>
  );
}

/** Bandeau clair (offre secondaire / reprise). */
export function LightBanner({
  overline, title, desc, actions, visual, className,
}: { overline?: ReactNode; title: ReactNode; desc?: ReactNode; actions?: ReactNode; visual?: ReactNode; className?: string }) {
  return (
    <section className={cx("relative flex overflow-hidden sm:min-h-[260px] rounded-[24px] border-2 border-line bg-white", className)}>
      <div className="relative z-10 flex flex-col sm:max-w-[58%] justify-center gap-2 p-6 sm:p-8">
        {overline && <div className="text-[13px] font-[800] uppercase tracking-wider text-brand">{overline}</div>}
        <h2 className="text-2xl font-[800] leading-tight text-ink">{title}</h2>
        {desc && <p className="text-sm leading-relaxed text-ink-2">{desc}</p>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {visual && <div className="absolute inset-y-0 end-0 hidden w-[45%] sm:block">{visual}</div>}
    </section>
  );
}

/** Bandeau dégradé bleu → vert (mise en avant d'un programme). */
export function GradientBanner({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx("overflow-hidden rounded-[24px] bg-brand shadow-[0_6px_0_var(--c-blue-700)] p-5 text-white sm:p-6", className)}>
      {children}
    </section>
  );
}

/** Bandeau chiffre clé (fond bleu nuit, grand nombre à droite). */
export function StatBanner({ title, desc, value, action }: { title: ReactNode; desc?: ReactNode; value: ReactNode; action?: ReactNode }) {
  return (
    <section className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[24px] bg-purple px-6 py-7 text-white shadow-[0_6px_0_#a568cc] sm:px-8">
      <div className="max-w-xl">
        <h2 className="text-xl font-[800]">{title}</h2>
        {desc && <p className="mt-1 text-sm text-white/80">{desc}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      <div className="grid size-28 place-items-center rounded-full bg-white/10 text-4xl font-[900] ring-4 ring-white/25">{value}</div>
    </section>
  );
}
