"use client";

import type { Bank } from "./questions";
import { shuffle } from "./questions";
import type { Question } from "./types";
import type { State } from "./store";
import { MODULES } from "./courses";

export type Mode = "chapter" | "module" | "signs" | "official" | "rules" | "weak" | "notebook" | "mix" | "new";

export const MODE_INFO: Record<Mode, { title: string; desc: string; titleAr: string; descAr: string }> = {
  mix: {
    title: "Mélange intelligent",
    desc: "Officielles + règles + panneaux, en priorité ce que tu n'as jamais vu ou raté.",
    titleAr: "مزيج ذكي",
    descAr: "أسئلة رسمية + قواعد + علامات، مع الأولوية لما لم تره أو أخطأت فيه.",
  },
  official: {
    title: "Questions officielles",
    desc: "La banque Perminou (image + audio), corrigée et expliquée.",
    titleAr: "الأسئلة الرسمية",
    descAr: "بنك أسئلة Perminou (صورة + صوت)، مصحح ومشروح.",
  },
  rules: {
    title: "Règles du code",
    desc: "Chiffres, priorités, sanctions, conduite : les questions pièges.",
    titleAr: "قواعد السير",
    descAr: "الأرقام، الأسبقية، العقوبات، السياقة: الأسئلة الخادعة.",
  },
  signs: {
    title: "Panneaux & schémas",
    desc: "Reconnaître les panneaux de tous les chapitres.",
    titleAr: "العلامات والرسوم",
    descAr: "التعرف على علامات جميع الدروس.",
  },
  weak: {
    title: "Mes points faibles",
    desc: "Les questions où tu te trompes le plus souvent.",
    titleAr: "نقاط ضعفي",
    descAr: "الأسئلة التي تخطئ فيها أكثر.",
  },
  notebook: {
    title: "Carnet d'erreurs",
    desc: "Révision espacée de tes erreurs (Leitner).",
    titleAr: "دفتر الأخطاء",
    descAr: "مراجعة متباعدة لأخطائك (طريقة لايتنر).",
  },
  new: {
    title: "Jamais vues",
    desc: "Uniquement des questions que tu n'as jamais faites.",
    titleAr: "أسئلة جديدة",
    descAr: "فقط الأسئلة التي لم تجب عنها من قبل.",
  },
  chapter: {
    title: "Quiz du chapitre",
    desc: "Toutes les questions liées à un chapitre.",
    titleAr: "اختبار الدرس",
    descAr: "جميع الأسئلة المرتبطة بدرس.",
  },
  module: {
    title: "Quiz de l'axe",
    desc: "Toutes les questions d'un axe de formation.",
    titleAr: "اختبار المحور",
    descAr: "جميع أسئلة محور من محاور التكوين.",
  },
};

/** Score de priorité : jamais vue > ratée récemment > réussie. */
function weight(q: Question, s: State) {
  const a = s.answers[q.id];
  if (!a) return 3 + Math.random();
  const ratio = a.ko / a.seen;
  return ratio * 3 + (a.lastOk ? 0 : 1.5) + Math.random() * 0.8;
}

export function pick(bank: Bank, s: State, mode: Mode, opts: { c?: string; n?: number }): Question[] {
  const n = opts.n ?? 20;
  const all = [...bank.official, ...bank.rules, ...bank.signs];
  let pool: Question[];
  switch (mode) {
    case "chapter":
      pool = all.filter((q) => q.chapter === opts.c);
      break;
    case "module": {
      const m = MODULES.find((x) => x.id === opts.c);
      const slugs = new Set(m?.chapters.map((c) => c.slug));
      pool = all.filter((q) => slugs.has(q.chapter));
      break;
    }
    case "signs":
      pool = bank.signs;
      break;
    case "official":
      pool = bank.official;
      break;
    case "rules":
      pool = bank.rules;
      break;
    case "new":
      pool = all.filter((q) => !s.answers[q.id]);
      break;
    case "weak":
      pool = all.filter((q) => s.answers[q.id]?.ko).sort((a, b) => weight(b, s) - weight(a, s));
      return pool.slice(0, n);
    case "notebook": {
      const now = Date.now();
      const due = Object.entries(s.srs)
        .filter(([, i]) => i.box < 5 && i.due <= now)
        .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
        .map(([id]) => bank.all.get(id))
        .filter(Boolean) as Question[];
      return due.slice(0, n);
    }
    default: {
      // Mélange : 50 % officielles, 30 % règles, 20 % panneaux, pondéré par la progression
      const by = (arr: Question[], k: number) => [...arr].sort((a, b) => weight(b, s) - weight(a, s)).slice(0, k);
      const o = by(bank.official, Math.round(n * 0.5));
      const r = by(bank.rules, Math.round(n * 0.3));
      const sg = by(bank.signs, n - o.length - r.length);
      return shuffle([...o, ...r, ...sg]).slice(0, n);
    }
  }
  return shuffle(pool).sort((a, b) => weight(b, s) - weight(a, s)).slice(0, n);
}

/** Examen blanc : 40 questions, au format de l'examen (priorité aux questions officielles). */
export function buildExam(bank: Bank): Question[] {
  const off = shuffle(bank.official);
  const fill = shuffle([...bank.rules, ...shuffle(bank.signs).slice(0, 40)]);
  return shuffle([...off.slice(0, 40), ...fill].slice(0, 40));
}
