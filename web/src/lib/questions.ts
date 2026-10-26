"use client";

import { useEffect, useState } from "react";
import { asset } from "./base";
import type { Card, ExamQuestion, Question, RuleQuestion } from "./types";

/** Retire emojis et numérotation d'un intitulé de catégorie. */
const cleanSection = (s: string) =>
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

const STOP = new Set(["على", "من", "في", "إلى", "او", "أو", "و", "عن", "مع", "ذات", "التي", "الذي", "علامة"]);
const words = (s: string) => new Set(s.replace(/[^؀-ۿ\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));

/**
 * Une carte panneau → QCM « Que signifie ce panneau ? ».
 * Les 3 distracteurs sont choisis parmi les intitulés les plus PROCHES (mots communs, même section,
 * même chapitre) pour ressembler aux pièges de l'examen.
 */
function cardsToQuestions(cards: Card[]): Question[] {
  const wordsOf = new Map(cards.map((c) => [c.label, words(c.label)]));
  const out: Question[] = [];
  for (const card of cards) {
    if (card.label.length > 140) continue;
    const rnd = seeded(card.img + card.label);
    const w = wordsOf.get(card.label)!;
    const scored = cards
      .filter((c) => c.module === card.module && c.label !== card.label && c.label.length <= 140)
      .map((c) => {
        const cw = wordsOf.get(c.label)!;
        let common = 0;
        cw.forEach((x) => w.has(x) && common++);
        const score = common * 2 + (c.section && c.section === card.section ? 2 : 0) + (c.chapter === card.chapter ? 1 : 0) + rnd() * 1.5;
        return { label: c.label, score };
      })
      .sort((a, b) => b.score - a.score);
    const pool: string[] = [];
    for (const s of scored) {
      if (pool.length >= 3) break;
      if (!pool.includes(s.label)) pool.push(s.label);
    }
    if (pool.length < 3) continue;
    const options = shuffle([card.label, ...pool], rnd);
    out.push({
      id: `s:${hash(card.img + "|" + card.label)}`,
      kind: "sign",
      chapter: card.chapter,
      prompt: "Que signifie ce panneau / ce schéma ?",
      promptAr: "ماذا تعني هذه العلامة ؟",
      img: asset(card.img),
      options: options.map((label) => ({ label })),
      answer: [options.indexOf(card.label)],
      multi: false,
      explanation: `La bonne réponse est « ${card.label} »${card.section ? ` — catégorie : ${cleanSection(card.section)}` : ""}.`,
      explanationAr: `الجواب الصحيح هو « ${card.label} »${card.section ? ` — الفئة: ${cleanSection(card.section).replace(/\s*\([^)]*\)\s*$/, "")}` : ""}.`,
      rappel: card.label,
      rappelAr: card.label,
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
