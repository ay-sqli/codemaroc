/**
 * Choix des mauvaises réponses (distracteurs) des questions « Que signifie ce panneau ? ».
 *
 * Un bon distracteur est PLAUSIBLE (même famille de panneaux, mots en commun) mais
 * CLAIREMENT FAUX : il ne doit jamais dire la même chose que la bonne réponse, ni pouvoir
 * être juste lui aussi. On écarte donc :
 *  - les formulations équivalentes (« على مستعملي » / « لمستعملي », alif, tā' marbūṭa, article…) ;
 *  - les intitulés qui englobent l'autre sans en changer le sens (« تحديد السرعة » / « تحديد السرعة 120 ») ;
 *    une différence qui inverse le sens (« نهاية », « ممنوع », « إجباري », « دخول »…) reste permise ;
 *  - les intitulés presque identiques (fautes de frappe, variantes d'écriture).
 * Fichier sans dépendance : utilisé par l'app (lib/questions) et par le script d'audit.
 */

export interface ChoiceCard {
  img: string;
  label: string;
  section?: string;
  chapter: string;
  module: string;
}

/** Mots sans valeur de sens pour la comparaison (prépositions, unités…). */
const STOP = new Set(["على", "من", "في", "الي", "او", "و", "عن", "مع", "ذات", "التي", "الذي", "علامه", "عند", "كلم", "س", "ساعه", "م", "ب", "ان", "هذه", "هذا"]);
/** Mots qui changent le sens : leur présence d'un seul côté rend deux intitulés différents. */
const FLIP = new Set([
  "نهايه", "بدايه", "ممنوع", "منع", "اجباري", "اجباريه", "الزامي", "دخول", "خروج", "يمين", "يسار", "اولويه", "خطر",
  "دنيا", "قصوي", "اقصي", "ادني", "مسموح", "رفع", "لا", "ليس", "غير",
  // français (questions de règles)
  "fin", "debut", "interdit", "interdiction", "obligatoire", "obligation", "pas", "jamais", "sauf", "seulement", "toujours",
  "droite", "gauche", "entree", "sortie", "minimum", "maximum", "minimale", "maximale", "plus", "moins", "avant", "apres",
]);
/** Mots outils français sans valeur de sens pour la comparaison. */
const STOP_FR = new Set([
  "le", "la", "les", "l", "de", "des", "du", "d", "un", "une", "et", "a", "au", "aux", "en", "pour", "par", "sur", "dans",
  "est", "sont", "avec", "ce", "cette", "ces", "que", "qui", "on", "se", "s", "il", "elle", "y", "ou", "km", "h", "m", "son", "sa", "ses",
]);

/** Forme normalisée d'un mot arabe (ou d'un nombre) pour comparer le sens, pas l'écriture. */
function normWord(w: string): string {
  let x = w
    .replace(/[ً-ٰٕـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
  if (/^\d/.test(x)) return x.replace(/[.,]/g, ".");
  if (x.startsWith("لل") && x.length > 4) x = "ال" + x.slice(2);
  else if (x.startsWith("ل") && !x.startsWith("ال") && x.length > 4) x = x.slice(1);
  if (x.startsWith("ال") && x.length > 3) x = x.slice(2);
  if (x.startsWith("وال") && x.length > 4) x = x.slice(3);
  return x;
}

export function meaningWords(label: string): Set<string> {
  const raw = label
    // NFD : retire les accents français ; en arabe, sépare la hamza (أ → ا + ٔ), retirée dans normWord.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^؀-ۿa-z0-9.,\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (const r of raw) {
    if (/^[a-z]/.test(r)) {
      // français : pluriel simple ramené au singulier
      const f = r.length > 3 && r.endsWith("s") ? r.slice(0, -1) : r;
      if (!STOP_FR.has(r) && !STOP_FR.has(f)) out.add(f);
      continue;
    }
    const w = normWord(r);
    if (!w || STOP.has(w) || STOP.has(r)) continue;
    if (!/^\d/.test(w) && w.length < 2) continue;
    out.add(w);
  }
  return out;
}

function levenshteinRatio(a: string, b: string) {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

/**
 * Deux intitulés peuvent-ils désigner la même chose (ou l'un être vrai quand l'autre l'est) ?
 * Si oui, ils ne doivent jamais se retrouver ensemble dans les propositions.
 */
export function tooClose(a: string, b: string): boolean {
  const A = meaningWords(a);
  const B = meaningWords(b);
  const ka = [...A].sort().join(" ");
  const kb = [...B].sort().join(" ");
  if (ka === kb) return true;
  // Mêmes mots, nombres différents (« تحديد السرعة 20 » / « 30 ») : bon piège, il faut lire le panneau.
  const nums = (S: Set<string>) => [...S].filter((w) => /^\d/.test(w)).sort().join(" ");
  const sameNumbers = nums(A) === nums(B);
  if (sameNumbers && levenshteinRatio(ka, kb) >= 0.88) return true;
  // « Nom du panneau : explication » : même nom de panneau = même panneau, quelle que soit l'explication.
  const head = (x: string) => (x.includes(":") ? [...meaningWords(x.split(":")[0])].sort().join(" ") : "");
  const ha = head(a);
  if (ha && ha === head(b)) return true;
  // Presque tous les mots en commun, sans mot qui change le sens ni nombre différent : même idée.
  const inter = [...A].filter((w) => B.has(w)).length;
  const jaccard = inter / (A.size + B.size - inter || 1);
  const diffWords = [...A, ...B].filter((w) => !(A.has(w) && B.has(w)));
  if (sameNumbers && jaccard >= 0.7 && !diffWords.some((w) => FLIP.has(w))) return true;
  const aInB = [...A].every((w) => B.has(w));
  const bInA = [...B].every((w) => A.has(w));
  if (aInB || bInA) {
    const diff = [...A, ...B].filter((w) => !(A.has(w) && B.has(w)));
    // L'un englobe l'autre : seule une différence qui inverse le sens les distingue vraiment.
    return !diff.some((w) => FLIP.has(w));
  }
  return false;
}

/** Les 3 distracteurs d'une carte : proches de la bonne réponse (plausibles) mais jamais équivalents. */
export function pickDistractors(
  card: ChoiceCard,
  cards: ChoiceCard[],
  rnd: () => number,
  count = 3,
  /** Contrôle supplémentaire, par exemple sur la traduction : deux intitulés arabes distincts peuvent se traduire pareil. */
  alsoClose?: (a: string, b: string) => boolean,
): string[] | null {
  const w = meaningWords(card.label);
  const len = card.label.length;
  const score = (c: ChoiceCard) => {
    const cw = meaningWords(c.label);
    let common = 0;
    cw.forEach((x) => w.has(x) && common++);
    const lenGap = Math.abs(Math.log((c.label.length + 8) / (len + 8)));
    return (
      common * 2 +
      (c.section && c.section === card.section ? 2 : 0) +
      (c.chapter === card.chapter ? 1 : 0) +
      (c.module === card.module ? 1.5 : 0) -
      lenGap * 2 +
      rnd() * 1.5
    );
  };
  const seen = new Set<string>([card.label]);
  const candidates = cards
    .filter((c) => c.label.length <= 140 && !seen.has(c.label) && (seen.add(c.label), true))
    .map((c) => ({ label: c.label, s: score(c) }))
    .sort((x, y) => y.s - x.s);
  const pool: string[] = [];
  for (const c of candidates) {
    if (pool.length >= count) break;
    if (tooClose(c.label, card.label)) continue;
    if (pool.some((p) => tooClose(p, c.label))) continue;
    if (alsoClose && (alsoClose(c.label, card.label) || pool.some((p) => alsoClose(p, c.label)))) continue;
    pool.push(c.label);
  }
  return pool.length >= count ? pool : null;
}
