/**
 * Contrôle des questions de quiz (à lancer après `python scripts/build_app.py`) :
 *   cd web && node scripts/audit-choices.ts [--dump questions-panneaux.txt] [--report rapport.txt]
 *
 * Erreurs (code de sortie 1) :
 *  - question « panneau » dont deux propositions disent la même chose (comparaison de sens de lib/choices)
 *    ou forment une paire interdite par la revue content/cards_review.json ;
 *  - deux questions « panneau » sur la même image ;
 *  - question de règles : propositions identiques, traduction arabe incomplète, bonne réponse hors liste ;
 *  - question officielle : case correcte hors des cases affichées.
 * À relire (sans erreur) : paires de propositions de règles que la comparaison de mots juge proches.
 * --dump écrit toutes les questions « panneau » (image, bonne réponse, propositions) pour une relecture humaine.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildSignChoices, cleanLabel, tooClose, type ChoiceCard } from "../src/lib/choices.ts";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
const cards = read<(ChoiceCard & { labelFr: string; sectionFr?: string })[]>("public/data/cards.json");
const quiz = read<{ id: string; t: string; q: string; o: string[]; oa?: string[]; a: number[] }[]>("public/data/quiz.json");
const exam = read<{ id: string; ans: number[]; n?: number }[]>("public/data/exam.json");

const errors: string[] = [];
const review: string[] = [];

// ---------------------------------------------------------------- questions « panneau »
const signs = buildSignChoices(cards);
const apartOf = new Map<string, Set<string>>();
const labelsOf = new Map<string, string[]>();
for (const c of cards) labelsOf.set(c.img, [...(labelsOf.get(c.img) ?? []), cleanLabel(c.label)]);
for (const c of cards)
  for (const img of c.x ?? [])
    for (const other of labelsOf.get(img) ?? []) {
      const me = cleanLabel(c.label);
      apartOf.set(me, (apartOf.get(me) ?? new Set()).add(other));
      apartOf.set(other, (apartOf.get(other) ?? new Set()).add(me));
    }
const byImg = new Map<string, string[]>();
for (const s of signs) {
  byImg.set(s.card.img, [...(byImg.get(s.card.img) ?? []), s.card.label]);
  const o = s.options;
  for (let i = 0; i < o.length; i++)
    for (let j = i + 1; j < o.length; j++) {
      const same = tooClose(o[i].ar, o[j].ar) || tooClose(o[i].fr, o[j].fr) || o[i].fr === o[j].fr || o[i].ar === o[j].ar;
      if (same || apartOf.get(o[i].ar)?.has(o[j].ar))
        errors.push(`panneau ${s.card.img} : « ${o[i].fr} » ≈ « ${o[j].fr} »`);
    }
}
for (const [img, labels] of byImg) if (labels.length > 1) errors.push(`deux questions sur la même image ${img} : ${labels.join(" / ")}`);
const skipped = cards.filter((c) => c.q === 0).length;

// ---------------------------------------------------------------- questions de règles
// Les signes + − × < > comptent (« Tiers » / « Tiers + », « PTAC + PV » / « PTAC − PV »).
const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}+−×÷<>≤≥=-]+/gu, " ").trim();
for (const q of quiz) {
  if (!q.a.length || q.a.some((a) => a < 0 || a >= q.o.length)) errors.push(`règle ${q.id} : bonne réponse hors des propositions`);
  if (!q.oa || q.oa.length !== q.o.length) errors.push(`règle ${q.id} : propositions arabes manquantes ou en nombre différent`);
  for (const opts of [q.o, q.oa ?? []]) {
    for (let i = 0; i < opts.length; i++)
      for (let j = i + 1; j < opts.length; j++) {
        if (norm(opts[i]) === norm(opts[j])) errors.push(`règle ${q.id} : propositions identiques « ${opts[i]} »`);
        else if (tooClose(opts[i], opts[j]))
          review.push(`${q.id} [${i}${q.a.includes(i) ? "✓" : "✗"}] ${opts[i]}  ⟷  [${j}${q.a.includes(j) ? "✓" : "✗"}] ${opts[j]}`);
      }
  }
}

// ---------------------------------------------------------------- questions officielles
for (const q of exam) {
  const n = q.n ?? 4;
  if (!q.ans.length || q.ans.some((a) => a < 1 || a > n)) errors.push(`officielle ${q.id} : case correcte hors des ${n} cases`);
}

const summary = [
  `Panneaux : ${signs.length} questions (${skipped} cartes du cours non posées après revue).`,
  `Règles : ${quiz.length} questions, ${review.length} paires de propositions proches à relire (contrastes voulus en général).`,
  `Officielles : ${exam.length} questions.`,
  errors.length ? `❌ ${errors.length} erreur(s) :` : "✅ Aucune erreur.",
  ...errors.slice(0, 50).map((e) => "  " + e),
];
console.log(summary.join("\n"));

const report = arg("--report");
if (report) writeFileSync(report, [...summary, "", "À relire (règles) :", ...review].join("\n"));
const dump = arg("--dump");
if (dump) {
  const lines: string[] = [];
  for (const s of signs) {
    lines.push(`${s.card.chapter} | ${s.card.img}`);
    s.options.forEach((o, i) => lines.push(`  ${i === s.answer ? "✓" : "✗"} ${o.fr}  ||  ${o.ar}`));
  }
  writeFileSync(dump, lines.join("\n"));
}
process.exit(errors.length ? 1 : 0);
