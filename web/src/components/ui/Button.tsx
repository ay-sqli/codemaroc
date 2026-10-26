import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "inverse" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold leading-tight whitespace-nowrap transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-2 border border-brand hover:border-brand-2",
  secondary: "bg-white text-brand border border-brand hover:bg-brand-50",
  tertiary: "text-brand hover:bg-brand-50 border border-transparent",
  ghost: "text-ink-2 hover:bg-panel border border-transparent",
  inverse: "bg-white text-brand border border-white hover:bg-brand-50",
  danger: "bg-white text-ko border border-ko hover:bg-ko-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-sm",
  md: "min-h-10 px-4 text-[15px]",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", block = false) {
  return cx(base, variants[variant], sizes[size], block && "w-full");
}

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  iconEnd?: ReactNode;
}

/** Bouton d'action. Primaire = une seule action principale par vue. */
export function Button({ variant, size, block, icon, iconEnd, className, children, ...rest }: Common & ComponentProps<"button">) {
  return (
    <button type="button" className={cx(buttonClass(variant, size, block), className)} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </button>
  );
}

/** Lien présenté comme un bouton (navigation). */
export function ButtonLink({ variant, size, block, icon, iconEnd, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cx(buttonClass(variant, size, block), className)} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </Link>
  );
}

/** Bouton icône carré (fermer, menu…) avec libellé accessible obligatoire. */
export function IconButton({ label, className, children, ...rest }: { label: string } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx("inline-grid size-10 place-items-center rounded-[4px] text-ink-2 transition-colors hover:bg-panel", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
