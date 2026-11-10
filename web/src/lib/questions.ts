"use client";

import { pickDistractors, tooClose } from "./choices";
import { useEffect, useState } from "react";
import { asset } from "./base";
import type { Card, ExamQuestion, Question, RuleQuestion } from "./types";

/** Retire emojis et numérotation d'un intitulé de catégorie. */
export const cleanSection = (s: string) =>
  s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{20E3}]/gu, "").replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim();

/**
 * Chargement des banques de questions (fichiers JSON statiques dans /public/data)
 * et conversion vers le format unifié `Question`.
 */

let cache: Promise<Bank> | null = null;

export interface Bank {
  official: Question[];
  rules: Question[];
  signs: Question[];
  cards: Card[];
  all: Map<string, Question>;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(asset(path));
  if (!r.ok) throw new Error(`Impossible de charger ${path}`);
  return r.json();
}

export function officialToQuestion(q: ExamQuestion): Question {
  const n = q.n ?? 4;
  return {
    id: `o:${q.id}`,
    kind: "official",
    chapter: q.t,
    prompt: q.q,
    promptAr: q.qa,
    img: asset(q.img),
    audio: asset(q.audio),
    options: Array.from({ length: n }, (_, i) => ({ label: String(i + 1) })),
    answer: q.ans.map((a) => a - 1),
    multi: true,
    explanation: q.e,
    explanationAr: q.ea,
    rappel: q.r,
    rappelAr: q.ra,
    schema: q.s,
    uncertain: q.c !== undefined && q.c < 0.75,
  };
}

/** Propositions « Vrai / Faux », « Oui / Non »… : on garde leur ordre naturel. */
const FIXED_ORDER = /^(vrai|faux|oui|non)\b/i;

export function ruleToQuestion(q: RuleQuestion): Question {
  // Ordre des propositions tiré au hasard à chaque chargement : on retient la règle, pas la position.
  const order = q.o.every((o) => FIXED_ORDER.test(o)) ? q.o.map((_, i) => i) : shuffle(q.o.map((_, i) => i));
  return {
    id: `r:${q.id}`,
    kind: "rule",
    chapter: q.t,
    prompt: q.q,
    promptAr: q.qa,
    img: asset(q.img),
    options: order.map((i) => ({ label: q.o[i], labelAr: q.oa?.[i] })),
    answer: q.a.map((a) => order.indexOf(a)),
    multi: q.a.length > 1,
    explanation: q.e,
    explanationAr: q.ea,
    rappel: q.r,
    rappelAr: q.ra,
    schema: q.s,
  };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Mélange déterministe (graine) pour que le même panneau garde les mêmes distracteurs. */
function seeded(seed: string) {
  let x = parseInt(hash(seed), 36) || 1;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Une carte panneau → QCM « Que signifie ce panneau ? ».
 * Les 3 distracteurs (lib/choices) sont proches de la bonne réponse pour ressembler aux pièges de
 * l'examen, mais jamais équivalents à elle ni entre eux (pas de « على » / « لـ », pas de
 * « تحديد السرعة » face à « تحديد السرعة 120 »).
 */
function cardsToQuestions(cards: Card[]): Question[] {
  const out: Question[] = [];
  const frOf = new Map<string, string>();
  for (const c of cards) if (c.labelFr && !frOf.has(c.label)) frOf.set(c.label, c.labelFr);
  for (const card of cards) {
    if (card.label.length > 140) continue;
    const key = card.k ?? card.label;
    const rnd = seeded(card.img + key);
    const pool = pickDistractors(card, cards, rnd, 3, (a, b) => tooClose(frOf.get(a) ?? a, frOf.get(b) ?? b));
    if (!pool) continue;
    const options = shuffle([card.label, ...pool], rnd);
    out.push({
      id: `s:${hash(card.img + "|" + key)}`,
      kind: "sign",
      chapter: card.chapter,
      prompt: "Que signifie ce panneau / ce schéma ?",
      promptAr: "ماذا تعني هذه العلامة ؟",
      img: asset(card.img),
      options: options.map((label) => ({ label: frOf.get(label) ?? label, labelAr: label })),
      answer: [options.indexOf(card.label)],
      multi: false,
      explanation: `La bonne réponse est « ${card.labelFr} »${card.sectionFr ? ` — catégorie : ${cleanSection(card.sectionFr)}` : ""}.`,
      explanationAr: `الجواب الصحيح هو « ${card.label} »${card.section ? ` — الفئة: ${cleanSection(card.section)}` : ""}.`,
      rappel: card.labelFr,
      rappelAr: card.label,
      section: card.section,
      sectionFr: card.sectionFr,
    });
  }
  return out;
}

export function loadBank(): Promise<Bank> {
  if (!cache) {
    cache = Promise.all([
      getJson<ExamQuestion[]>("/data/exam.json"),
      getJson<RuleQuestion[]>("/data/quiz.json"),
      getJson<Card[]>("/data/cards.json"),
    ]).then(([exam, quiz, cards]) => {
      const official = exam.filter((q) => q.ans?.length).map(officialToQuestion);
      const rules = quiz.map(ruleToQuestion);
      const signs = cardsToQuestions(cards);
      const all = new Map<string, Question>();
      [...official, ...rules, ...signs].forEach((q) => all.set(q.id, q));
      return { official, rules, signs, cards, all };
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

export function useBank() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadBank().then(setBank, (e) => setError(String(e.message ?? e)));
  }, []);
  return { bank, error };
}

export function isCorrect(q: Question, picked: number[]) {
  const a = [...q.answer].sort().join(",");
  const b = [...picked].sort().join(",");
  return a === b;
}
