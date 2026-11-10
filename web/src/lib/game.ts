"use client";

import { MODULES, stripEmoji } from "./courses";
import type { Bank } from "./questions";
import { shuffle } from "./questions";
import type { GameState, State } from "./store";
import type { Chapter, Question } from "./types";
import type { IconName } from "@/components/game/GameIcon";

/**
 * Parcours façon jeu : toutes les questions de la banque rangées en étapes, de la plus facile à la plus
 * difficile, jusqu'au sommet (examen final). Chaque étape = cours express + questions ; on ne passe à la
 * suivante qu'après l'avoir réussie.
 *
 *   Section (axe)  →  Unité (chapitre)  →  Étapes (≈ 12 questions)  →  Défi de l'unité
 *   … puis le Sommet : 40 questions comme à l'examen.
 */

/** Ordre des axes : on commence par ce qui se voit (panneaux), on finit par les chiffres (sanctions). */
export const SECTION_ORDER = ["01", "03", "04", "02", "06", "05"];

/** Couleur de chaque section (couleur principale + ombre du relief). */
export const SECTION_COLORS: Record<string, { c: string; d: string; soft: string }> = {
  "01": { c: "#d92b2b", d: "#a81c1c", soft: "#fdedec" }, // rouge petit taxi
  "03": { c: "#198754", d: "#115c39", soft: "#eafaf1" }, // vert drapeau
  "04": { c: "#2980b9", d: "#1f618d", soft: "#ebf5fb" }, // bleu indication
  "02": { c: "#e67e22", d: "#b35f12", soft: "#fdf2e9" }, // orange feu
  "06": { c: "#1b4f72", d: "#11344c", soft: "#e3edf4" }, // bleu autoroute
  "05": { c: "#b9770e", d: "#8a5808", soft: "#fef9e7" }, // or sombre
};

const LESSON_SIZE = 12;
const CHALLENGE_SIZE = 10;
export const SUMMIT_SIZE = 40;
/** Erreurs permises : étape (3 cœurs), défi (3 cœurs), sommet (8 erreurs → 32/40 minimum, comme à l'examen). */
export const HEARTS = { lesson: 3, challenge: 3, summit: 9 } as const;
export const XP = { lesson: 10, perfect: 5, replay: 5, challenge: 20, summit: 100 } as const;
export const QUESTION_SECONDS = 30;

export type NodeKind = "lesson" | "challenge" | "summit";

export interface GameNode {
  id: string;
  kind: NodeKind;
  /** Chapitre de l'unité (vide pour le sommet). */
  unit: string;
  section: string;
  /** Rang de l'étape dans l'unité (1…n). */
  index: number;
  /** Questions de l'étape (étape) ou réservoir où piocher (défi, sommet). */
  qids: string[];
  title: { fr: string; ar: string };
}

export interface GameUnit {
  chapter: Chapter;
  section: string;
  /** Numéro de l'unité dans le parcours (1…54). */
  n: number;
  nodes: GameNode[];
}

export interface GameSection {
  id: string;
  n: number;
  fr: string;
  ar: string;
  units: GameUnit[];
}

export interface GamePath {
  sections: GameSection[];
  summit: GameNode;
  /** Tous les nœuds dans l'ordre du parcours (le sommet en dernier). */
  flat: GameNode[];
  byId: Map<string, GameNode>;
  /** Nombre de questions différentes couvertes par le parcours. */
  total: number;
}

const DIGITS = /\d/;

/** Difficulté estimée : panneau < règle simple < règle à plusieurs réponses / chiffres < question officielle. */
export function difficulty(q: Question) {
  if (q.kind === "sign") return 1 + Math.min(0.5, (q.rappel?.length ?? 0) / 200);
  if (q.kind === "rule") {
    const text = (q.prompt ?? "") + q.options.map((o) => o.label ?? "").join(" ");
    return 2 + (q.multi ? 1.2 : 0) + (q.options.length - 2) * 0.2 + (DIGITS.test(text) ? 0.6 : 0) + Math.min(1, (q.prompt?.length ?? 0) / 200);
  }
  return 4 + (q.answer.length > 1 ? 0.8 : 0) + (q.options.length === 4 ? 0.3 : 0) + (q.uncertain ? 0.2 : 0);
}

/** Titre de catégorie sans emoji ni numéro. */
const sectionLabel = (s: string) => stripEmoji(s).replace(/^\s*\d+\.\s*/, "").trim();

function sectionName(ar?: string, fr?: string) {
  if (!ar) return null;
  return { fr: sectionLabel(fr || ar), ar: sectionLabel(ar) };
}

function lessonTitle(qs: Question[]): { fr: string; ar: string } {
  const kinds = new Set(qs.map((q) => q.kind));
  if (kinds.size === 1 && kinds.has("sign")) {
    const names: { fr: string; ar: string }[] = [];
    for (const q of qs) {
      const n = sectionName(q.section, q.sectionFr);
      if (n && !names.some((x) => x.fr === n.fr)) names.push(n);
    }
    if (!names.length) return { fr: "Panneaux", ar: "العلامات" };
    const more = names.length > 2 ? " …" : "";
    return { fr: names.slice(0, 2).map((n) => n.fr).join(" · ") + more, ar: names.slice(0, 2).map((n) => n.ar).join(" · ") + more };
  }
  if (kinds.has("official") && kinds.size === 1) return { fr: "Questions d'examen", ar: "أسئلة الامتحان" };
  if (kinds.has("official")) return { fr: "Règles et questions d'examen", ar: "قواعد وأسئلة الامتحان" };
  if (kinds.has("sign")) return { fr: "Panneaux et règles", ar: "علامات وقواعد" };
  return { fr: "Règles du code", ar: "قواعد السير" };
}

/** Découpe `n` éléments en paquets de taille proche de LESSON_SIZE. */
function chunk<T>(arr: T[]): T[][] {
  if (!arr.length) return [];
  const k = Math.max(1, Math.round(arr.length / LESSON_SIZE));
  const size = arr.length / k;
  return Array.from({ length: k }, (_, i) => arr.slice(Math.round(i * size), Math.round((i + 1) * size)));
}

let cached: { bank: Bank; path: GamePath } | null = null;

export function buildPath(bank: Bank): GamePath {
  if (cached?.bank === bank) return cached.path;
  const all = [...bank.signs, ...bank.rules, ...bank.official];
  const seen = new Set<string>();
  const byChapter = new Map<string, Question[]>();
  for (const q of all) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    if (!byChapter.has(q.chapter)) byChapter.set(q.chapter, []);
    byChapter.get(q.chapter)!.push(q);
  }
  // Panneaux : dans l'ordre des catégories du cours (une étape = une famille de panneaux).
  const sectionRank = new Map<string, number>();
  bank.cards.forEach((c) => !sectionRank.has(c.chapter + c.section) && sectionRank.set(c.chapter + c.section, sectionRank.size));

  const sections: GameSection[] = [];
  const flat: GameNode[] = [];
  let unitN = 0;
  SECTION_ORDER.forEach((sid, si) => {
    const m = MODULES.find((x) => x.id === sid);
    if (!m) return;
    const units: GameUnit[] = [];
    for (const ch of m.chapters) {
      const qs = byChapter.get(ch.slug) ?? [];
      if (!qs.length) continue;
      const signs = qs
        .filter((q) => q.kind === "sign")
        .sort((a, b) => (sectionRank.get(a.chapter + (a.section ?? "")) ?? 999) - (sectionRank.get(b.chapter + (b.section ?? "")) ?? 999));
      const others = qs.filter((q) => q.kind !== "sign").sort((a, b) => difficulty(a) - difficulty(b) || a.id.localeCompare(b.id));
      const lessons = [...chunk(signs), ...chunk(others)];
      const nodes: GameNode[] = lessons.map((l, i) => ({
        id: `${ch.slug}.${i + 1}`,
        kind: "lesson",
        unit: ch.slug,
        section: sid,
        index: i + 1,
        qids: l.map((q) => q.id),
        title: lessonTitle(l),
      }));
      nodes.push({
        id: `${ch.slug}.defi`,
        kind: "challenge",
        unit: ch.slug,
        section: sid,
        index: nodes.length + 1,
        qids: qs.map((q) => q.id),
        title: { fr: "Défi de l'unité", ar: "تحدي الوحدة" },
      });
      unitN++;
      units.push({ chapter: ch, section: sid, n: unitN, nodes });
      flat.push(...nodes);
    }
    sections.push({ id: sid, n: si + 1, fr: m.fr, ar: stripEmoji(m.ar), units });
  });
  const summit: GameNode = {
    id: "sommet",
    kind: "summit",
    unit: "",
    section: "",
    index: 1,
    qids: [...seen],
    title: { fr: "Le Sommet : examen final", ar: "القمة: الامتحان النهائي" },
  };
  flat.push(summit);
  const path: GamePath = { sections, summit, flat, byId: new Map(flat.map((n) => [n.id, n])), total: seen.size };
  cached = { bank, path };
  return path;
}

export type NodeStatus = "done" | "current" | "locked";

/** Première étape non validée = étape en cours ; tout ce qui suit est verrouillé. */
export function currentIndex(path: GamePath, g: GameState) {
  const i = path.flat.findIndex((n) => !g.done[n.id]);
  return i === -1 ? path.flat.length : i;
}

export function statusOf(path: GamePath, g: GameState, id: string, cur = currentIndex(path, g)): NodeStatus {
  if (g.done[id]) return "done";
  const i = path.flat.findIndex((n) => n.id === id);
  return i === cur ? "current" : "locked";
}

/** Poids de révision : les questions jamais vues ou ratées d'abord. */
function weight(q: Question, s: State) {
  const a = s.answers[q.id];
  if (!a) return 2 + Math.random();
  return (a.ko / a.seen) * 3 + (a.lastOk ? 0 : 1.5) + Math.random();
}

/** Questions d'une tentative. Étape : toujours les mêmes ; défi et sommet : tirage pondéré par tes erreurs. */
export function questionsFor(node: GameNode, bank: Bank, s: State): Question[] {
  const qs = node.qids.map((id) => bank.all.get(id)).filter(Boolean) as Question[];
  if (node.kind === "lesson") return shuffle(qs);
  if (node.kind === "challenge") return shuffle([...qs].sort((a, b) => weight(b, s) - weight(a, s)).slice(0, CHALLENGE_SIZE));
  // Sommet : format de l'examen, priorité aux questions officielles.
  const off = shuffle(qs.filter((q) => q.kind === "official")).slice(0, 28);
  const rest = shuffle(qs.filter((q) => q.kind !== "official")).slice(0, SUMMIT_SIZE - off.length);
  return shuffle([...off, ...rest]);
}

export function heartsFor(kind: NodeKind) {
  return HEARTS[kind];
}

/** Grade du conducteur selon le nombre d'étapes validées. */
export const RANKS: { min: number; fr: string; ar: string; icon: IconName }[] = [
  { min: 0, fr: "Débutant", ar: "مبتدئ", icon: "first-step" },
  { min: 10, fr: "Apprenti", ar: "متعلم", icon: "learner" },
  { min: 50, fr: "Conducteur", ar: "سائق", icon: "wheel" },
  { min: 130, fr: "Confirmé", ar: "متمرس", icon: "mountain" },
  { min: 250, fr: "Champion", ar: "بطل", icon: "champion" },
];

/** Défis du jour (quêtes). */
export function dailyQuests(g: GameState, day: string) {
  return [
    { id: "xp", fr: "Gagne 50 XP", ar: "اربح 50 نقطة خبرة", value: g.xpDays[day] ?? 0, goal: 50 },
    { id: "lessons", fr: "Valide 3 étapes", ar: "أكمل 3 مراحل", value: g.lessonDays[day] ?? 0, goal: 3 },
    { id: "combo", fr: "Enchaîne 10 bonnes réponses", ar: "أجب 10 مرات متتالية بشكل صحيح", value: g.comboDays[day] ?? 0, goal: 10 },
  ];
}
