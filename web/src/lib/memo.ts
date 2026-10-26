import memo from "@/data/memo.json";
import type { Lang } from "./i18n";

/** Fiches mémo : astuces mnémotechniques, en français et en arabe. */
export interface MemoItem {
  q: string;
  a: string;
  hook: string;
  qa?: string;
  aa?: string;
  ha?: string;
}
export interface MemoGroup {
  id: string;
  emoji: string;
  title: string;
  intro: string;
  titleAr?: string;
  introAr?: string;
  items: MemoItem[];
}

export const MEMO = memo as MemoGroup[];
export const MEMO_ITEMS: MemoItem[] = MEMO.flatMap((g) => g.items);

export function memoText(it: MemoItem, lang: Lang) {
  return lang === "ar" && it.qa ? { q: it.qa, a: it.aa ?? it.a, hook: it.ha ?? it.hook } : { q: it.q, a: it.a, hook: it.hook };
}
export function memoGroupText(g: MemoGroup, lang: Lang) {
  return lang === "ar" && g.titleAr ? { title: g.titleAr, intro: g.introAr ?? g.intro } : { title: g.title, intro: g.intro };
}
