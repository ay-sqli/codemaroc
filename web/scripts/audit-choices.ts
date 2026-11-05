/**
 * Audit des propositions de réponse : repère les propositions qui disent la même chose
 * (ou dont l'une englobe l'autre) dans les questions « panneau » et dans les questions de règles.
 *   node scripts/audit-choices.ts [rapport.txt]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { meaningWords, pickDistractors, tooClose, type ChoiceCard } from "../src/lib/choices.ts";

const cards = JSON.parse(readFileSync("public/data/cards.json", "utf8")) as ChoiceCard[];
const quiz = JSON.parse(readFileSync("public/data/quiz.json", "utf8")) as { id: string; t: string; q: string; o: string[]; oa?: string[]; a: number[] }[];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function seeded(seed: string) {
  let x = parseInt(hash(seed), 36) || 1;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

/** Ancien tirage (avant correction) : les intitulés qui ont le plus de mots en commun. */
function oldPick(card: ChoiceCard): string[] | null {
  const rnd = seeded(card.img + card.label);
  const w = meaningWords(card.label);
  const pool: string[] = [];
  const scored = cards
    .filter((c) => c.module === card.module && c.label !== card.label && c.label.length <= 140)
    .map((c) => {
      let common = 0;
      meaningWords(c.label).forEach((x) => w.has(x) && common++);
      return { label: c.label, s: common * 2 + (c.section && c.section === card.section ? 2 : 0) + (c.chapter === card.chapter ? 1 : 0) + rnd() * 1.5 };
    })
    .sort((a, b) => b.s - a.s);
  for (const s of scored) {
    if (pool.length >= 3) break;
    if (!pool.includes(s.label)) pool.push(s.label);
  }
  return pool.length >= 3 ? pool : null;
}

const lines: string[] = [];
let oldBad = 0, newBad = 0, oldN = 0, newN = 0;
const examples: string[] = [];
for (const card of cards) {
  if (card.label.length > 140) continue;
  const o = oldPick(card);
  if (o) {
    oldN++;
    const opts = [card.label, ...o];
    const bad = opts.some((x, i) => opts.some((y, j) => j > i && tooClose(x, y)));
    if (bad) {
      oldBad++;
      if (examples.length < 12) examples.push(`  ✓ ${card.label}\n     ✗ ${o.join("\n     ✗ ")}`);
    }
  }
  const n = pickDistractors(card, cards, seeded(card.img + card.label));
  if (n) {
    newN++;
    const opts = [card.label, ...n];
    if (opts.some((x, i) => opts.some((y, j) => j > i && tooClose(x, y)))) newBad++;
  }
}
lines.push(`PANNEAUX : ancien tirage ${oldBad}/${oldN} questions avec propositions équivalentes ; nouveau ${newBad}/${newN}.`);
lines.push("Exemples (ancien tirage) :", ...examples, "");

let ruleBad = 0;
lines.push("QUESTIONS DE RÈGLES : paires de propositions trop proches");
for (const q of quiz) {
  const flagged: string[] = [];
  for (const opts of [q.o, q.oa ?? []]) {
    for (let i = 0; i < opts.length; i++)
      for (let j = i + 1; j < opts.length; j++)
        if (tooClose(opts[i], opts[j])) flagged.push(`[${i}${q.a.includes(i) ? "✓" : "✗"}] ${opts[i]}  ⟷  [${j}${q.a.includes(j) ? "✓" : "✗"}] ${opts[j]}`);
  }
  if (flagged.length) {
    ruleBad++;
    lines.push(`- ${q.id} | ${q.q}`, ...flagged.map((f) => "    " + f));
  }
}
lines.push(`Total : ${ruleBad}/${quiz.length} questions de règles signalées.`);
const out = process.argv[2];
if (out) writeFileSync(out, lines.join("\n"));
console.log(lines[0]);
console.log(lines[lines.length - 1]);
