"use client";

import { buildSignChoices, cleanLabel, hash, shuffle } from "./choices";
import { useEffect, useState } from "react";
import { asset } from "./base";
import { setKnownQuestions } from "./store";
import type { Card, ExamQuestion, Question, RuleQuestion } from "./types";

/** Retire emojis et numérotation d'un intitulé de catégorie. */
const cleanSection = cleanLabel;

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

export { shuffle };

/**
 * Cartes panneau → QCM « Que signifie ce panneau ? » (choix des propositions : lib/choices).
 * Seules les cartes retenues par la revue content/cards_review.json sont posées ; les 3 mauvaises
 * réponses ressemblent aux pièges de l'examen sans jamais être vraies elles aussi.
 * L'identifiant dépend de l'image et de l'intitulé d'origine : progression et carnet d'erreurs restent valables.
 */
function cardsToQuestions(cards: Card[]): Question[] {
  return buildSignChoices(cards).map(({ card, options, answer }) => {
    const labelFr = cleanLabel(card.labelFr || card.label);
    const labelAr = cleanLabel(card.label);
    return {
      id: `s:${hash(card.img + "|" + (card.k ?? card.label))}`,
      kind: "sign",
      chapter: card.chapter,
      prompt: "Que signifie ce panneau / ce schéma ?",
      promptAr: "ماذا تعني هذه العلامة ؟",
      img: asset(card.img),
      options: options.map((o) => ({ label: o.fr, labelAr: o.ar })),
      answer: [answer],
      multi: false,
      explanation: `La bonne réponse est « ${labelFr} »${card.sectionFr ? ` — catégorie : ${cleanSection(card.sectionFr)}` : ""}.`,
      explanationAr: `الجواب الصحيح هو « ${labelAr} »${card.section ? ` — الفئة: ${cleanSection(card.section)}` : ""}.`,
      rappel: labelFr,
      rappelAr: labelAr,
      section: card.section,
      sectionFr: card.sectionFr,
    };
  });
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
      setKnownQuestions(all.keys());
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
