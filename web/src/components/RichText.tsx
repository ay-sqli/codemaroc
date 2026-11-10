"use client";

import { useLang } from "@/lib/i18n";
import { escapeHtml, withPictos } from "@/lib/pictos";

/** Texte d'explication avec de petites images devant les mots-clés. */
export function RichText({ text, className, max }: { text: string; className?: string; max?: number }) {
  const { lang } = useLang();
  return <span className={className} dangerouslySetInnerHTML={{ __html: withPictos(escapeHtml(text), lang, max) }} />;
}
