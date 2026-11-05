"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Breadcrumbs, cx } from "@/components/ui";

/**
 * Nombre de pages ouvertes dans l'application depuis l'arrivée sur le site : s'il y en a eu au moins
 * une avant celle-ci, « Retour » revient simplement en arrière ; sinon (lien direct, page rechargée),
 * il mène à la page parente.
 */
let inAppSteps = -1;

/** À placer une fois dans le cadre de l'application : compte les changements de page. */
export function NavTracker() {
  const path = usePathname();
  useEffect(() => {
    inAppSteps++;
  }, [path]);
  return null;
}

/** Bouton « Retour » : visible, assez grand pour le doigt, flèche inversée en arabe. */
export function BackButton({
  href = "/",
  label,
  onClick,
  confirmText,
  className,
}: {
  /** page parente si l'on n'est pas arrivé ici depuis l'application */
  href?: string;
  label?: ReactNode;
  /** action personnalisée (ex. quitter un examen en cours) à la place de la navigation */
  onClick?: () => void;
  /** demande de confirmation avant de partir */
  confirmText?: string;
  className?: string;
}) {
  const router = useRouter();
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        if (onClick) return onClick();
        if (inAppSteps > 0) router.back();
        else router.push(href);
      }}
      className={cx("duo-btn duo-btn-ghost !min-h-11 shrink-0 !gap-1.5 !rounded-[14px] !px-3.5 !text-[13px]", className)}
    >
      <ArrowLeft className="size-5 rtl:rotate-180" strokeWidth={2.6} />
      {label ?? t("Retour", "رجوع")}
    </button>
  );
}

/** En-tête de page secondaire : bouton « Retour » + fil d'Ariane (masqué sur mobile, le bouton suffit). */
export function BackBar({ href = "/", items, className }: { href?: string; items: { label: ReactNode; href?: string }[]; className?: string }) {
  return (
    <div className={cx("flex items-center gap-4", className)}>
      <BackButton href={href} />
      <div className="min-w-0 max-sm:hidden">
        <Breadcrumbs items={items} />
      </div>
    </div>
  );
}
