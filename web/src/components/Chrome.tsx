"use client";

import { Globe } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { cx } from "./ui";

/**
 * Logo de l'application (public/brand) : complet (emblème + « Code Maroc / كود المغرب »)
 * ou emblème seul (`compact`) quand la place manque.
 */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useLang();
  return (
    <img
      src={asset(compact ? "/brand/emblem-160.webp" : "/brand/logo.webp")}
      alt={t("Code Maroc", "كود المغرب")}
      draggable={false}
      className={cx("select-none", compact ? "h-14 w-auto" : "h-auto w-[210px]", className)}
    />
  );
}

/** Bouton de changement de langue (FR ⇄ AR). */
export function LangSwitch({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const { lang, setLang } = useLang();
  const next = lang === "ar" ? "fr" : "ar";
  return (
    <button
      onClick={() => setLang(next)}
      aria-label={next === "ar" ? "Afficher le site en arabe" : "عرض الموقع بالفرنسية"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[12px] text-sm font-[800] uppercase tracking-wide",
        tone === "dark" ? "text-white/85 hover:text-white" : "h-10 px-2 text-[#64748b] hover:text-[#d92b2b]",
        className,
      )}
    >
      <Globe className="size-5" />
      <span lang={next} className={next === "ar" ? "font-[family-name:var(--font-arabic)] normal-case" : ""}>
        {next === "ar" ? "العربية" : "Français"}
      </span>
    </button>
  );
}

/** « 3 jours » / « 3 أيام » */
export function daysLabel(n: number, lang: "fr" | "ar") {
  if (lang === "ar") return n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n >= 3 && n <= 10 ? `${n} أيام` : `${n} يوما`;
  return `${n} jour${n > 1 ? "s" : ""}`;
}
