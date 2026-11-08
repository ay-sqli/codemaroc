"use client";

import { useEffect, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Bilinguisme français / arabe.
 * La langue est choisie par l'utilisateur et gardée dans son navigateur.
 * Les textes sont écrits côte à côte dans le code : t("Cours", "الدروس").
 */

export type Lang = "fr" | "ar";

const KEY = "codemaroc-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    return localStorage.getItem(KEY) === "ar" ? "ar" : "fr";
  } catch {
    return "fr";
  }
}

let current: Lang | null = null;

function getSnapshot(): Lang {
  if (current === null) current = read();
  return current;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = read();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Langue en cours, hors composant React. */
export function currentLang(): Lang {
  return getSnapshot();
}

export function applyLang(lang: Lang) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
}

export function setLang(lang: Lang) {
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {}
  applyLang(lang);
  listeners.forEach((l) => l());
}

export type TFn = (fr: string, ar: string) => string;

export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, () => "fr" as Lang);
  const t: TFn = (fr, ar) => (lang === "ar" ? ar : fr);
  return { lang, setLang, t, ar: lang === "ar" };
}

/** Texte bilingue utilisable depuis un composant serveur. */
export function T({ fr, ar }: { fr: ReactNode; ar: ReactNode }) {
  const { lang } = useLang();
  return <>{lang === "ar" ? ar : fr}</>;
}

/** Barre de navigation dont le nom lu par les lecteurs d'écran suit la langue. */
export function TNav({ labelFr, labelAr, ...props }: { labelFr: string; labelAr: string } & Omit<ComponentProps<"nav">, "aria-label">) {
  const { t } = useLang();
  return <nav aria-label={t(labelFr, labelAr)} {...props} />;
}

/** Choisit la version arabe si elle existe et que la langue est l'arabe. */
export function pick<V>(lang: Lang, fr: V, ar: V | undefined | null): V {
  return lang === "ar" && ar ? ar : fr;
}

/** Titres d'onglet en arabe (les titres français viennent des métadonnées de chaque page). */
const AR_TITLES: [RegExp, string][] = [
  [/^\/cours\/[^/]+/, "درس"],
  [/^\/cours/, "الدروس"],
  [/^\/entrainement\/session/, "حصة تمرين"],
  [/^\/entrainement/, "التمرن"],
  [/^\/erreurs/, "دفتر الأخطاء"],
  [/^\/examen/, "امتحان تجريبي"],
  [/^\/lecon/, "مرحلة من المسار"],
  [/^\/memo/, "المذكرة"],
  [/^\/profil/, "ملفي"],
  [/^\/progression/, "التقدم"],
  [/^\/schemas/, "الرسوم التفاعلية"],
  [/^\/tableau-de-bord/, "لوحة القيادة"],
  [/^\/admin/, "لوحة الإدارة"],
];

function arabicTitle(path: string) {
  const hit = AR_TITLES.find(([re]) => re.test(path));
  return `${hit ? hit[1] : "مراجعة رخصة السياقة صنف ب"} — Code Maroc`;
}

/** Synchronise <html lang dir> et le titre de l'onglet avec la langue choisie. */
export function LangSync() {
  const { lang } = useLang();
  const path = usePathname();
  useEffect(() => {
    applyLang(lang);
  }, [lang]);
  useEffect(() => {
    if (lang !== "ar") return;
    const wanted = arabicTitle(path);
    const original = document.title;
    const apply = () => {
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    // Next réécrit le titre à chaque navigation : on le remet en arabe.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = original;
    };
  }, [lang, path]);
  return null;
}

/** Script exécuté avant l'affichage : évite le « saut » de mise en page en arabe. */
export const LANG_BOOT = `try{if(localStorage.getItem("${KEY}")==="ar"){document.documentElement.lang="ar";document.documentElement.dir="rtl"}}catch(e){}`;

/** Nombres : chiffres occidentaux dans les deux langues (comme au Maroc). */
export function fmtDate(ts: number | Date, lang: Lang, opts: Intl.DateTimeFormatOptions) {
  return new Date(ts).toLocaleDateString(lang === "ar" ? "ar-MA-u-nu-latn" : "fr-FR", opts);
}

/**
 * Accord du nom avec le nombre en arabe :
 * 1 → مفرد، 2 → مثنى، 3–10 → جمع، 11 فما فوق → مفرد منصوب.
 * ex. arN(3, ["سؤال", "سؤالان", "أسئلة", "سؤالا"]) → « 3 أسئلة »
 */
export function arN(n: number, [one, two, few, many]: [string, string, string, string]) {
  if (n === 1) return `1 ${one}`;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

/** Accord français simple : frN(3, "question") → « 3 questions ». */
export function frN(n: number, word: string, plural = word + "s") {
  return `${n} ${n > 1 ? plural : word}`;
}

/** Raccourci bilingue pour les quantités. */
export function countLabel(lang: Lang, n: number, fr: [string, string?], ar: [string, string, string, string]) {
  return lang === "ar" ? (n === 0 ? `0 ${ar[3]}` : arN(n, ar)) : frN(n, fr[0], fr[1]);
}
