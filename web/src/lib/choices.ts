/**
 * Choix des mauvaises réponses (distracteurs) des questions « Que signifie ce panneau ? ».
 *
 * Un bon distracteur est PLAUSIBLE (même famille de panneaux, mots en commun) mais
 * CLAIREMENT FAUX : il ne doit jamais dire la même chose que la bonne réponse, ni pouvoir
 * être juste lui aussi. On écarte donc :
 *  - les formulations équivalentes (« على مستعملي » / « لمستعملي », alif, tā' marbūṭa, article…) ;
 *  - les intitulés qui englobent l'autre sans en changer le sens (« تحديد السرعة » / « تحديد السرعة 120 ») ;
 *    une différence qui inverse le sens (« نهاية », « ممنوع », « إجباري », « دخول »…) reste permise ;
 *  - les intitulés presque identiques (fautes de frappe, variantes d'écriture) ;
 *  - les paires relevées à la main dans content/cards_review.json (champ `x`) : deux panneaux
 *    dont l'un est aussi vrai pour l'image de l'autre (gîte / hôtel, issue de secours / chemin vers
 *    l'issue de secours…), que la comparaison de mots ne peut pas voir.
 * La même revue retire des questions les cartes qui ne sont pas un panneau à reconnaître (`q: 0`).
 * Fichier sans dépendance : utilisé par l'app (lib/questions) et par le script d'audit.
 */

export interface ChoiceCard {
  img: string;
  label: string;
  labelFr?: string;
  /** Ancien intitulé : garde stable l'identifiant de la question. */
  k?: string;
  section?: string;
  chapter: string;
  module: string;
  /** 0 : la carte n'est pas posée en question (revue content/cards_review.json). */
  q?: number;
  /** 1 : pas posée en question, mais son intitulé peut servir de mauvaise réponse. */
  d?: number;
  /** Images des cartes à ne jamais proposer dans la même question que celle-ci. */
  x?: string[];
}

/** Retire emojis et numérotation d'un intitulé (« 🟢 Vert : … », « 2. Analyser… »). */
export const cleanLabel = (s: string) =>
  s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{20E3}]/gu, "").replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim();

export function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Tirage déterministe (graine) : le même panneau garde les mêmes propositions. */
export function seeded(seed: string) {
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

/**
 * Famille d'une carte pour le choix des mauvaises réponses : les panneaux du module « La route » se
 * mélangent entre eux ; panonceaux, marquages au sol, feux et gestes des agents, éclairage, manches à
 * air et chaque chapitre des autres modules restent dans leur famille (un panonceau « Cyclomoteurs »
 * ne doit pas servir de leurre pour le panneau « Accès interdit aux cyclomoteurs »).
 */
const OWN_FAMILY = new Set(["08_panonceaux", "09_feux_et_agents", "10_signalisation_horizontale", "13_types_de_routes", "14_conditions_eclairage", "15_conditions_climatiques", "16_virages_et_pentes"]);
/** Familles dont les intitulés ne servent jamais de leurre ailleurs. */
const CLOSED_FAMILY = new Set(["08_panonceaux", "10_signalisation_horizontale"]);
/** Chapitres hors module « La route » dont les cartes retenues sont des panneaux (le STOP en arabe). */
const SIGN_CHAPTERS = new Set(["07_regles_priorite"]);
export const familyOf = (c: ChoiceCard) =>
  (c.module === "01" && !OWN_FAMILY.has(c.chapter)) || SIGN_CHAPTERS.has(c.chapter) ? "panneaux" : c.chapter;

/**
 * Début d'un intitulé français (« accès interdit », « vitesse limitée », « cédez passage ») : au plus deux
 * propositions d'une même question commencent pareil, pour que les 4 réponses ne se ressemblent pas toutes.
 */
export function headOf(label: string) {
  const s = label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const first = s.split(/\s[:\-–]\s|:/)[0];
  const words = first.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOP_FR.has(w));
  return words.slice(0, 2).join(" ");
}

export interface PickOptions {
  count?: number;
  /** Compléter avec d'autres familles quand celle de la carte ne suffit pas (vrai par défaut). */
  fallback?: boolean;
  /** Contrôle supplémentaire (traduction, paires de la revue) : deux intitulés arabes distincts peuvent se traduire pareil. */
  alsoClose?: (a: string, b: string) => boolean;
  /** Début d'intitulé, comparé entre propositions (voir headOf). */
  head?: (label: string) => string;
  maxSameHead?: number;
}

/**
 * Les 3 distracteurs d'une carte : proches de la bonne réponse (plausibles) mais jamais équivalents.
 * On pioche d'abord dans la famille de la carte, puis dans les familles ouvertes si elle est trop petite.
 */
export function pickDistractors(card: ChoiceCard, cards: ChoiceCard[], rnd: () => number, opts: PickOptions = {}): string[] | null {
  const { count = 3, fallback = true, alsoClose, head, maxSameHead = 2 } = opts;
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
    .map((c) => ({ c, s: score(c) }))
    .sort((x, y) => y.s - x.s);
  const myFamily = familyOf(card);
  const heads = new Map<string, number>();
  const headCount = (label: string) => (head ? heads.get(head(label)) ?? 0 : 0);
  const take = (label: string) => head && heads.set(head(label), headCount(label) + 1);
  take(card.label);
  const pool: string[] = [];
  const tryAdd = (c: ChoiceCard) => {
    if (pool.length >= count || pool.includes(c.label)) return;
    if (tooClose(c.label, card.label)) return;
    if (pool.some((p) => tooClose(p, c.label))) return;
    if (alsoClose && (alsoClose(c.label, card.label) || pool.some((p) => alsoClose(p, c.label)))) return;
    if (headCount(c.label) >= maxSameHead) return;
    pool.push(c.label);
    take(c.label);
  };
  for (const { c } of candidates) if (familyOf(c) === myFamily) tryAdd(c);
  if (fallback) for (const { c } of candidates) if (familyOf(c) !== myFamily && !CLOSED_FAMILY.has(familyOf(c))) tryAdd(c);
  return pool.length >= count ? pool : null;
}

export interface SignChoice<C extends ChoiceCard> {
  card: C;
  /** Les 4 propositions (intitulés arabes et français, sans emoji ni numéro), déjà mélangées. */
  options: { ar: string; fr: string }[];
  answer: number;
}

/**
 * Toutes les questions « Que signifie ce panneau ? » : une par carte retenue par la revue, avec
 * 3 mauvaises réponses tirées des cartes autorisées (posées ou `d: 1`), jamais équivalentes à la
 * bonne ni entre elles, ni liées par une paire `x` de la revue.
 */
export function buildSignChoices<C extends ChoiceCard>(cards: C[]): SignChoice<C>[] {
  const frOf = new Map<string, string>();
  for (const c of cards) if (c.labelFr && !frOf.has(c.label)) frOf.set(c.label, c.labelFr);
  const labelsOf = new Map<string, string[]>();
  for (const c of cards) labelsOf.set(c.img, [...(labelsOf.get(c.img) ?? []), c.label]);
  const apart = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!apart.has(a)) apart.set(a, new Set());
    apart.get(a)!.add(b);
  };
  for (const c of cards)
    for (const img of c.x ?? [])
      for (const other of labelsOf.get(img) ?? []) {
        link(c.label, other);
        link(other, c.label);
      }
  const fr = (label: string) => frOf.get(label) ?? label;
  const close = (a: string, b: string) => !!apart.get(a)?.has(b) || tooClose(fr(a), fr(b));
  const pool = cards.filter((c) => c.q !== 0 || c.d === 1);
  // Petite famille (3 manches à air, 3 chocs d'un accident) : 3 propositions plutôt que des leurres hors sujet.
  const familySize = new Map<string, Set<string>>();
  for (const c of pool) familySize.set(familyOf(c), (familySize.get(familyOf(c)) ?? new Set()).add(c.label));
  const out: SignChoice<C>[] = [];
  for (const card of cards) {
    if (card.q === 0 || card.label.length > 140) continue;
    const rnd = seeded(card.img + (card.k ?? card.label));
    const n = familySize.get(familyOf(card))?.size ?? 0;
    const small = n === 3;
    const picked = pickDistractors(card, pool, rnd, {
      count: small ? 2 : 3,
      fallback: !small,
      maxSameHead: small ? 3 : 2,
      alsoClose: close,
      head: (l) => headOf(fr(l)),
    });
    if (!picked) continue;
    const labels = shuffle([card.label, ...picked], rnd);
    out.push({
      card,
      options: labels.map((l) => ({ ar: cleanLabel(l), fr: cleanLabel(fr(l)) })),
      answer: labels.indexOf(card.label),
    });
  }
  return out;
}
