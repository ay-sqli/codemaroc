export interface Chapter {
  slug: string;
  pid: number;
  emoji: string;
  ar: string;
  fr: string;
  color: string;
  module: string;
  ready: boolean;
  /** Fiche en arabe (la version française est dans lib/coursesFr). */
  md?: string;
  nCards?: number;
}

export interface Module {
  id: string;
  dir: string;
  emoji: string;
  ar: string;
  fr: string;
  desc: string;
  chapters: Chapter[];
}

/** Carte panneau/schéma extraite des cours : image + intitulé exact. */
export interface Card {
  img: string;
  /** Intitulé et catégorie en arabe. */
  label: string;
  section: string;
  /** Intitulé et catégorie en français. */
  labelFr: string;
  sectionFr: string;
  /** Ancien intitulé : garde stable l'identifiant de la question. */
  k?: string;
  chapter: string;
  module: string;
}

/** Question officielle de la banque Perminou (image + audio), corrigée. */
export interface ExamQuestion {
  id: string;
  img: string;
  audio: string | null;
  /** Bonnes cases (1 à 4). */
  ans: number[];
  /** Nombre de cases affichées (2 ou 4). */
  n?: number;
  /** Résumé de la question (FR). */
  q: string;
  /** Explication détaillée (FR). */
  e: string;
  /** Règle à retenir. */
  r: string;
  /** Chapitre lié (slug). */
  t: string;
  /** Schéma interactif lié. */
  s?: string;
  /** Confiance du corrigé (0–1) quand l'image est ambiguë. */
  c?: number;
  /** Traductions arabes de q / e / r. */
  qa?: string;
  ea?: string;
  ra?: string;
}

/** Question rédigée à partir des cours. */
export interface RuleQuestion {
  id: string;
  t: string;
  q: string;
  qa?: string;
  img?: string;
  o: string[];
  a: number[];
  e: string;
  r?: string;
  s?: string;
  /** Traductions arabes des propositions, de l'explication et du rappel. */
  oa?: string[];
  ea?: string;
  ra?: string;
}

/** Format unifié utilisé par le lecteur de quiz. */
export interface Question {
  id: string;
  kind: "official" | "sign" | "rule";
  chapter: string;
  prompt?: string;
  promptAr?: string;
  img?: string;
  audio?: string | null;
  options: { label?: string; labelAr?: string; img?: string }[];
  answer: number[];
  multi: boolean;
  explanation: string;
  explanationAr?: string;
  rappel?: string;
  rappelAr?: string;
  schema?: string;
  uncertain?: boolean;
  /** Catégorie du panneau dans le cours (questions « panneau » uniquement). */
  section?: string;
  sectionFr?: string;
}
