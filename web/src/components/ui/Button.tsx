import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "inverse" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// Boutons « en relief » : ombre pleine de 4 px sous le bouton, qui s'écrase au clic.
const base =
  "inline-flex items-center justify-center gap-2 rounded-[14px] font-[800] uppercase tracking-[0.05em] leading-tight whitespace-nowrap " +
  "font-[family-name:var(--font-display)] transition-[filter,transform,box-shadow] duration-75 ease-out active:translate-y-[4px] active:shadow-none rtl:tracking-normal " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white border-2 border-brand-2 shadow-[0_5px_0_var(--c-red-brand-d)] hover:brightness-105",
  secondary: "bg-white text-info border-2 border-line shadow-[0_4px_0_var(--c-grey-300)] hover:bg-panel",
  tertiary: "text-brand hover:bg-brand-50 border-2 border-transparent active:translate-y-0",
  ghost: "text-muted hover:bg-panel border-2 border-transparent active:translate-y-0",
  inverse: "bg-white text-brand border-2 border-white shadow-[0_4px_0_rgb(0_0_0/0.15)] hover:bg-brand-50",
  danger: "bg-ko text-white border-2 border-ko-700 shadow-[0_4px_0_var(--c-red-700)] hover:brightness-105",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-[13px]",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-[50px] px-7 text-[15px]",
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
      className={cx("inline-grid size-10 place-items-center rounded-[12px] text-muted transition-colors hover:bg-panel", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
