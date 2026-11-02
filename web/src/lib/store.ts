"use client";

import { useSyncExternalStore } from "react";

/**
 * Progression de l'utilisateur, stockée uniquement dans son navigateur (localStorage).
 * Pas de base de données : chaque personne qui ouvre l'app a sa propre progression,
 * exportable / importable en JSON depuis la page Progression.
 */

export interface AnswerStat {
  seen: number;
  ok: number;
  ko: number;
  last: number;
  lastOk: boolean;
}

/** Boîte de Leitner du carnet d'erreurs (1 = à revoir vite … 5 = maîtrisé). */
export interface SrsItem {
  box: number;
  due: number;
  added: number;
  chapter: string;
}

export interface ExamResult {
  ts: number;
  score: number;
  total: number;
  seconds: number;
  wrong: string[];
}

export interface Settings {
  examDate?: string;
  dailyGoal: number;
  timer: boolean;
  autoAudio: boolean;
  theme: "system" | "light" | "dark";
}

/** Mode jeu (parcours) : étapes validées, XP et défis du jour. */
export interface GameState {
  /** Étapes validées : id → date et précision (0–1) de la meilleure tentative. */
  done: Record<string, { ts: number; acc: number }>;
  xp: number;
  xpDays: Record<string, number>;
  lessonDays: Record<string, number>;
  /** Meilleure série de bonnes réponses d'affilée, par jour. */
  comboDays: Record<string, number>;
  sound: boolean;
  /** Date du dernier fichier de sauvegarde téléchargé. */
  lastBackup?: number;
}

export interface State {
  v: 1;
  game: GameState;
  answers: Record<string, AnswerStat>;
  srs: Record<string, SrsItem>;
  read: Record<string, number>;
  exams: ExamResult[];
  days: Record<string, number>;
  flags: Record<string, string>;
  settings: Settings;
}

const KEY = "narsa-revision-v1";
const DAY = 86_400_000;
/** Intervalles de révision par boîte (en jours). */
export const SRS_INTERVALS = [0, 1, 2, 4, 8, 16];

const initialGame: GameState = { done: {}, xp: 0, xpDays: {}, lessonDays: {}, comboDays: {}, sound: true };

const initial: State = {
  v: 1,
  game: initialGame,
  answers: {},
  srs: {},
  read: {},
  exams: [],
  days: {},
  flags: {},
  settings: { dailyGoal: 40, timer: true, autoAudio: false, theme: "system" },
};

let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      state = { ...initial, ...p, settings: { ...initial.settings, ...p.settings }, game: { ...initialGame, ...p.game } };
    }
  } catch {
    /* stockage indisponible (navigation privée…) : l'app fonctionne sans sauvegarde */
  }
  // Demande au navigateur de ne jamais effacer ces données de lui-même (manque d'espace, inactivité…).
  navigator.storage?.persist?.().catch(() => {});
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(updater: (s: State) => State) {
  load();
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export function getState() {
  load();
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(initial),
  );
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Enregistre une réponse : statistiques + carnet d'erreurs (Leitner). */
export function recordAnswer(id: string, ok: boolean, chapter: string) {
  set((s) => {
    const prev = s.answers[id] ?? { seen: 0, ok: 0, ko: 0, last: 0, lastOk: false };
    const answers = {
      ...s.answers,
      [id]: { seen: prev.seen + 1, ok: prev.ok + (ok ? 1 : 0), ko: prev.ko + (ok ? 0 : 1), last: Date.now(), lastOk: ok },
    };
    const srs = { ...s.srs };
    const item = srs[id];
    if (!ok) {
      srs[id] = { box: 1, due: Date.now() + SRS_INTERVALS[1] * DAY, added: item?.added ?? Date.now(), chapter };
    } else if (item) {
      const box = Math.min(5, item.box + 1);
      srs[id] = { ...item, box, due: Date.now() + SRS_INTERVALS[box] * DAY };
    }
    const d = today();
    return { ...s, answers, srs, days: { ...s.days, [d]: (s.days[d] ?? 0) + 1 } };
  });
}

/** Ajoute manuellement une question au carnet (« je veux la revoir »). */
export function addToNotebook(id: string, chapter: string) {
  set((s) => (s.srs[id] ? s : { ...s, srs: { ...s.srs, [id]: { box: 1, due: Date.now(), added: Date.now(), chapter } } }));
}

export function removeFromNotebook(id: string) {
  set((s) => {
    const srs = { ...s.srs };
    delete srs[id];
    return { ...s, srs };
  });
}

export function markRead(slug: string) {
  set((s) => ({ ...s, read: { ...s.read, [slug]: Date.now() } }));
}

export function recordExam(r: ExamResult) {
  set((s) => ({ ...s, exams: [...s.exams, r].slice(-100) }));
}

export function flagQuestion(id: string, note: string) {
  set((s) => ({ ...s, flags: { ...s.flags, [id]: note } }));
}

/** Étape du parcours réussie : XP gagnés, précision et meilleure série de la tentative. */
export function completeLesson(id: string, xp: number, acc: number, combo: number) {
  set((s) => {
    const d = today();
    const g = s.game;
    const prev = g.done[id];
    return {
      ...s,
      game: {
        ...g,
        done: { ...g.done, [id]: { ts: Date.now(), acc: Math.max(acc, prev?.acc ?? 0) } },
        xp: g.xp + xp,
        xpDays: { ...g.xpDays, [d]: (g.xpDays[d] ?? 0) + xp },
        lessonDays: { ...g.lessonDays, [d]: (g.lessonDays[d] ?? 0) + 1 },
        comboDays: { ...g.comboDays, [d]: Math.max(combo, g.comboDays[d] ?? 0) },
      },
    };
  });
}

/** Série de bonnes réponses d'une tentative ratée : compte quand même pour le défi du jour. */
export function recordCombo(combo: number) {
  set((s) => {
    const d = today();
    if ((s.game.comboDays[d] ?? 0) >= combo) return s;
    return { ...s, game: { ...s.game, comboDays: { ...s.game.comboDays, [d]: combo } } };
  });
}

export function setGameSound(sound: boolean) {
  set((s) => ({ ...s, game: { ...s.game, sound } }));
}

export function updateSettings(p: Partial<Settings>) {
  set((s) => ({ ...s, settings: { ...s.settings, ...p } }));
}

export function exportState() {
  return JSON.stringify(getState(), null, 2);
}

/** Télécharge toute la progression dans un fichier JSON (à garder ou à importer sur un autre appareil). */
export function downloadBackup() {
  const blob = new Blob([exportState()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `progression-code-maroc-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  set((s) => ({ ...s, game: { ...s.game, lastBackup: Date.now() } }));
}

export function importState(json: string) {
  const parsed = JSON.parse(json) as State;
  if (parsed?.v !== 1 || typeof parsed.answers !== "object") throw new Error("Fichier invalide");
  set(() => ({ ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings }, game: { ...initialGame, ...parsed.game } }));
}

export function resetState() {
  set(() => initial);
}

/** Remplace tout l'état (synchronisation avec le compte en ligne). */
export function replaceState(next: State) {
  set(() => ({ ...initial, ...next, settings: { ...initial.settings, ...next.settings }, game: { ...initialGame, ...next.game } }));
}

/** Écoute chaque modification de la progression (sauvegarde en ligne). Renvoie la fonction de désabonnement. */
export function onStateChange(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * Fusion de deux progressions (appareil + compte) sans rien perdre :
 * réponses → la plus récente, étapes validées → union, XP et compteurs → maximum.
 */
export function mergeStates(a: State, b: State): State {
  const answers: State["answers"] = { ...a.answers };
  for (const [id, r] of Object.entries(b.answers ?? {})) if (!answers[id] || r.last > answers[id].last) answers[id] = r;
  const srs: State["srs"] = { ...a.srs };
  for (const [id, it] of Object.entries(b.srs ?? {})) {
    const newerB = (b.answers?.[id]?.last ?? 0) >= (a.answers?.[id]?.last ?? 0);
    if (!srs[id] || newerB) srs[id] = it;
  }
  const maxMap = (x: Record<string, number> = {}, y: Record<string, number> = {}) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = Math.max(out[k] ?? 0, v);
    return out;
  };
  const done = { ...a.game.done };
  for (const [id, d] of Object.entries(b.game?.done ?? {})) done[id] = done[id] ? { ts: Math.max(done[id].ts, d.ts), acc: Math.max(done[id].acc, d.acc) } : d;
  const exams = [...(a.exams ?? []), ...(b.exams ?? [])]
    .filter((e, i, all) => all.findIndex((x) => x.ts === e.ts) === i)
    .sort((x, y) => x.ts - y.ts)
    .slice(-100);
  return {
    v: 1,
    answers,
    srs,
    read: maxMap(a.read, b.read),
    exams,
    days: maxMap(a.days, b.days),
    flags: { ...a.flags, ...b.flags },
    settings: { ...a.settings, ...b.settings },
    game: {
      ...a.game,
      done,
      xp: Math.max(a.game.xp ?? 0, b.game?.xp ?? 0),
      xpDays: maxMap(a.game.xpDays, b.game?.xpDays),
      lessonDays: maxMap(a.game.lessonDays, b.game?.lessonDays),
      comboDays: maxMap(a.game.comboDays, b.game?.comboDays),
      lastBackup: Math.max(a.game.lastBackup ?? 0, b.game?.lastBackup ?? 0) || undefined,
    },
  };
}

/** État vierge, complété par les valeurs par défaut (pour fusionner un état venu du serveur). */
export function normalizeState(s: Partial<State> | null | undefined): State {
  return { ...initial, ...(s ?? {}), settings: { ...initial.settings, ...(s?.settings ?? {}) }, game: { ...initialGame, ...(s?.game ?? {}) } } as State;
}

/** Série de jours consécutifs d'activité (jusqu'à aujourd'hui ou hier). */
export function streak(days: Record<string, number>) {
  let n = 0;
  const d = new Date();
  if (!days[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
  while (days[d.toISOString().slice(0, 10)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
