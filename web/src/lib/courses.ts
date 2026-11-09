import data from "@/data/courses.json";
import { asset, withBase } from "./base";
import type { Chapter, Module } from "./types";

export const MODULES = (data as Module[]).map((m) => ({
  ...m,
  chapters: m.chapters.map((c) => (c.md ? { ...c, md: withBase(c.md) } : c)),
}));

export const CHAPTERS: Chapter[] = MODULES.flatMap((m) => m.chapters);

export function getChapter(slug: string) {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}

export function moduleOf(slug: string) {
  return MODULES.find((m) => m.chapters.some((c) => c.slug === slug));
}

/** Chapitres précédent / suivant dans l'ordre du programme. */
export function neighbours(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return { prev: CHAPTERS[i - 1], next: CHAPTERS[i + 1] };
}

/** Couleurs d'accent par chapitre (classes Tailwind complètes pour le scan JIT). */
export const ACCENTS: Record<string, { bg: string; soft: string; text: string; ring: string }> = {
  blue: { bg: "bg-blue-600", soft: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-900" },
  amber: { bg: "bg-amber-500", soft: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-900" },
  rose: { bg: "bg-rose-600", soft: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-900" },
  sky: { bg: "bg-sky-600", soft: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200 dark:ring-sky-900" },
  indigo: { bg: "bg-indigo-600", soft: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-200 dark:ring-indigo-900" },
  emerald: { bg: "bg-emerald-600", soft: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-900" },
  teal: { bg: "bg-teal-600", soft: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200 dark:ring-teal-900" },
  slate: { bg: "bg-slate-600", soft: "bg-slate-100 dark:bg-slate-800/60", text: "text-slate-700 dark:text-slate-300", ring: "ring-slate-200 dark:ring-slate-700" },
  red: { bg: "bg-red-600", soft: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", ring: "ring-red-200 dark:ring-red-900" },
  cyan: { bg: "bg-cyan-600", soft: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", ring: "ring-cyan-200 dark:ring-cyan-900" },
  yellow: { bg: "bg-yellow-500", soft: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-300", ring: "ring-yellow-200 dark:ring-yellow-900" },
  orange: { bg: "bg-orange-500", soft: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-200 dark:ring-orange-900" },
  lime: { bg: "bg-lime-600", soft: "bg-lime-50 dark:bg-lime-950/40", text: "text-lime-700 dark:text-lime-300", ring: "ring-lime-200 dark:ring-lime-900" },
  violet: { bg: "bg-violet-600", soft: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-200 dark:ring-violet-900" },
  stone: { bg: "bg-stone-600", soft: "bg-stone-100 dark:bg-stone-800/60", text: "text-stone-700 dark:text-stone-300", ring: "ring-stone-200 dark:ring-stone-700" },
};

export function accent(color: string) {
  return ACCENTS[color] ?? ACCENTS.blue;
}

/** Retire les emojis (le design system n'en affiche pas). */
export function stripEmoji(s: string) {
  return s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{20E3}\u{200D}]/gu, "").replace(/\s{2,}/g, " ").trim();
}

/** Première illustration « panneau » d'un chapitre (vignette des cartes). */
export function coverOf(c: Chapter) {
  if (c.cover) return asset(c.cover);
  if (!c.md) return undefined;
  const small = c.md.match(/<img src="([^"]+)">/);
  if (small) return small[1];
  return c.md.match(/<img src="([^"]+)"/)?.[1];
}

/** Nombre de sections et temps de lecture estimé d'une fiche. */
export function ficheStats(c: Chapter) {
  const md = c.md ?? "";
  const sections = (md.match(/^## /gm) ?? []).length;
  const words = md.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return { sections, minutes: Math.max(3, Math.round(words / 120)) };
}

export function chapterIndex(slug: string) {
  const m = moduleOf(slug);
  return m ? m.chapters.findIndex((c) => c.slug === slug) + 1 : 0;
}

/** Intitulé d'un axe ou d'un chapitre dans la langue choisie. */
export function nameOf(x: { fr: string; ar: string }, lang: "fr" | "ar") {
  return lang === "ar" ? stripEmoji(x.ar) : x.fr;
}

/** Présentation de chaque axe en français (la version arabe vient du programme : `desc`). */
const MODULE_DESC_FR: Record<string, string> = {
  "01": "Signalisation verticale et horizontale, panneaux de danger, d'interdiction, d'obligation, d'indication et intersections.",
  "02": "Vitesse, priorités, dépassement, arrêt et stationnement, autoroute, distances de sécurité, panne et accident.",
  "03": "Catégories de permis, alcool et médicaments, vigilance, temps de réaction et prise de décision.",
  "04": "Documents administratifs, éléments mécaniques, aides à la conduite, véhicules prioritaires et environnement.",
  "05": "Permis à points, amendes, délits, fourrière, suspension et retrait du permis.",
  "06": "Temps de réaction, distance d'arrêt, perte de contrôle, équipements de sécurité, conduite sous influence et état de santé.",
};

export function moduleDesc(m: Module, lang: "fr" | "ar") {
  return lang === "ar" ? stripEmoji(m.desc) : (MODULE_DESC_FR[m.id] ?? stripEmoji(m.desc));
}
